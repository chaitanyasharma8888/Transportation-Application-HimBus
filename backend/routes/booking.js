const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../database/setup');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

function generateBookingRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'HB';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getSeatLayout(totalSeats, layout) {
  // layout is '2x2' — seats per row = 4
  const seatsPerRow = layout === '2x2' ? 4 : 4;
  const seats = [];

  for (let i = 1; i <= totalSeats; i++) {
    const row = Math.ceil(i / seatsPerRow);
    const col = ((i - 1) % seatsPerRow) + 1;
    seats.push({ seat_number: i, row, column: col });
  }
  return seats;
}

// GET /api/seats/:routeId/:date — seat layout with availability
router.get('/seats/:routeId/:date', (req, res) => {
  try {
    const { routeId, date } = req.params;

    const db = getDb();

    // Get route + bus info
    const route = db.prepare(`
      SELECT r.*, b.total_seats, b.layout, b.bus_type, b.bus_number
      FROM routes r
      JOIN buses b ON r.bus_id = b.id
      WHERE r.id = ?
    `).get(routeId);

    if (!route) {
      return res.status(404).json({ error: 'Route not found.' });
    }

    // Get all booked/blocked seats for this route+date
    const bookedSeats = db.prepare(
      `SELECT seat_number, status FROM seat_inventory WHERE route_id = ? AND journey_date = ? AND status IN ('booked', 'blocked')`
    ).all(routeId, date);

    const bookedMap = {};
    for (const s of bookedSeats) {
      bookedMap[s.seat_number] = s.status;
    }

    // Build seat layout
    const layout = getSeatLayout(route.total_seats, route.layout);
    const seats = layout.map(seat => ({
      seat_number: seat.seat_number,
      row: seat.row,
      column: seat.column,
      status: bookedMap[seat.seat_number] || 'available',
    }));

    res.json({
      route_id: Number(routeId),
      date,
      bus_number: route.bus_number,
      bus_type: route.bus_type,
      total_seats: route.total_seats,
      layout: route.layout,
      seats,
    });
  } catch (err) {
    console.error('Seats error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/bookings — create a booking (auth optional for guest)
router.post('/bookings', optionalAuth, (req, res) => {
  try {
    const {
      route_id,
      journey_date,
      seats,
      passenger_details,
      guest_name,
      guest_email,
      guest_phone,
    } = req.body;

    // Validate required fields
    if (!route_id || !journey_date || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: 'route_id, journey_date, and seats (array) are required.' });
    }

    if (!passenger_details || !Array.isArray(passenger_details) || passenger_details.length === 0) {
      return res.status(400).json({ error: 'passenger_details array is required.' });
    }

    if (seats.length !== passenger_details.length) {
      return res.status(400).json({ error: 'Number of seats must match number of passengers.' });
    }

    // Validate passenger details
    for (const p of passenger_details) {
      if (!p.name || !p.age || !p.gender) {
        return res.status(400).json({ error: 'Each passenger must have name, age, and gender.' });
      }
    }

    // Guest must provide contact info
    if (!req.user && (!guest_name || !guest_email || !guest_phone)) {
      return res.status(400).json({ error: 'Guest bookings require guest_name, guest_email, and guest_phone.' });
    }

    // Validate date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(journey_date)) {
      return res.status(400).json({ error: 'journey_date must be in YYYY-MM-DD format.' });
    }

    const jDate = new Date(journey_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (jDate < today) {
      return res.status(400).json({ error: 'Journey date cannot be in the past.' });
    }

    const db = getDb();

    // Get route info
    const route = db.prepare(`
      SELECT r.*, b.total_seats
      FROM routes r
      JOIN buses b ON r.bus_id = b.id
      WHERE r.id = ?
    `).get(route_id);

    if (!route) {
      return res.status(404).json({ error: 'Route not found.' });
    }

    // Validate seat numbers are in range
    for (const seatNum of seats) {
      if (seatNum < 1 || seatNum > route.total_seats) {
        return res.status(400).json({ error: `Invalid seat number: ${seatNum}. Must be 1-${route.total_seats}.` });
      }
    }

    // Check seat availability — use a transaction
    const booking = db.transaction(() => {
      // Check if any requested seat is already booked
      for (const seatNum of seats) {
        const existing = db.prepare(
          `SELECT status FROM seat_inventory WHERE route_id = ? AND journey_date = ? AND seat_number = ?`
        ).get(route_id, journey_date, seatNum);

        if (existing && existing.status !== 'available') {
          throw new Error(`Seat ${seatNum} is already ${existing.status}.`);
        }
      }

      // Generate unique booking ref
      let booking_ref;
      let attempts = 0;
      do {
        booking_ref = generateBookingRef();
        const exists = db.prepare('SELECT id FROM bookings WHERE booking_ref = ?').get(booking_ref);
        if (!exists) break;
        attempts++;
      } while (attempts < 10);

      const total_fare = route.fare * seats.length;

      // Create booking
      const result = db.prepare(`
        INSERT INTO bookings (booking_ref, user_id, guest_name, guest_email, guest_phone, route_id, journey_date, seats, num_passengers, total_fare, status, payment_status, passenger_details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'pending', ?)
      `).run(
        booking_ref,
        req.user ? req.user.id : null,
        guest_name || null,
        guest_email || null,
        guest_phone || null,
        route_id,
        journey_date,
        JSON.stringify(seats),
        seats.length,
        total_fare,
        JSON.stringify(passenger_details)
      );

      const bookingId = result.lastInsertRowid;

      // Create seat_inventory records
      const insertSeat = db.prepare(`
        INSERT INTO seat_inventory (route_id, journey_date, seat_number, status, booking_id)
        VALUES (?, ?, ?, 'booked', ?)
        ON CONFLICT(route_id, journey_date, seat_number) DO UPDATE SET status = 'booked', booking_id = ?
      `);

      for (const seatNum of seats) {
        insertSeat.run(route_id, journey_date, seatNum, bookingId, bookingId);
      }

      return {
        booking_ref,
        booking_id: bookingId,
        total_fare,
      };
    })();

    // Fetch full booking details to return
    const fullBooking = db.prepare(`
      SELECT b.*, 
        r.departure_time, r.arrival_time, r.duration_mins,
        bus.bus_number, bus.bus_type,
        fs.name AS from_station, fs.city AS from_city,
        ts.name AS to_station, ts.city AS to_city
      FROM bookings b
      JOIN routes r ON b.route_id = r.id
      JOIN buses bus ON r.bus_id = bus.id
      JOIN bus_stations fs ON r.from_station_id = fs.id
      JOIN bus_stations ts ON r.to_station_id = ts.id
      WHERE b.booking_ref = ?
    `).get(booking.booking_ref);

    res.status(201).json({
      message: 'Booking created successfully.',
      booking: {
        booking_ref: fullBooking.booking_ref,
        journey_date: fullBooking.journey_date,
        seats: JSON.parse(fullBooking.seats),
        num_passengers: fullBooking.num_passengers,
        total_fare: fullBooking.total_fare,
        status: fullBooking.status,
        payment_status: fullBooking.payment_status,
        passenger_details: JSON.parse(fullBooking.passenger_details),
        departure_time: fullBooking.departure_time,
        arrival_time: fullBooking.arrival_time,
        duration_mins: fullBooking.duration_mins,
        bus_number: fullBooking.bus_number,
        bus_type: fullBooking.bus_type,
        from_station: fullBooking.from_station,
        from_city: fullBooking.from_city,
        to_station: fullBooking.to_station,
        to_city: fullBooking.to_city,
        created_at: fullBooking.created_at,
      },
    });
  } catch (err) {
    if (err.message && err.message.startsWith('Seat')) {
      return res.status(409).json({ error: err.message });
    }
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/bookings — list user's bookings (authenticated)
router.get('/bookings', authenticateToken, (req, res) => {
  try {
    const db = getDb();

    const bookings = db.prepare(`
      SELECT b.*, 
        r.departure_time, r.arrival_time, r.duration_mins,
        bus.bus_number, bus.bus_type,
        fs.name AS from_station, fs.city AS from_city,
        ts.name AS to_station, ts.city AS to_city
      FROM bookings b
      JOIN routes r ON b.route_id = r.id
      JOIN buses bus ON r.bus_id = bus.id
      JOIN bus_stations fs ON r.from_station_id = fs.id
      JOIN bus_stations ts ON r.to_station_id = ts.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(req.user.id);

    const result = bookings.map(bk => ({
      booking_ref: bk.booking_ref,
      journey_date: bk.journey_date,
      seats: JSON.parse(bk.seats),
      num_passengers: bk.num_passengers,
      total_fare: bk.total_fare,
      status: bk.status,
      payment_status: bk.payment_status,
      passenger_details: JSON.parse(bk.passenger_details),
      departure_time: bk.departure_time,
      arrival_time: bk.arrival_time,
      duration_mins: bk.duration_mins,
      bus_number: bk.bus_number,
      bus_type: bk.bus_type,
      from_station: bk.from_station,
      from_city: bk.from_city,
      to_station: bk.to_station,
      to_city: bk.to_city,
      created_at: bk.created_at,
    }));

    res.json({ bookings: result });
  } catch (err) {
    console.error('List bookings error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/bookings/:bookingRef — get single booking by ref
router.get('/bookings/:bookingRef', optionalAuth, (req, res) => {
  try {
    const { bookingRef } = req.params;
    const db = getDb();

    const bk = db.prepare(`
      SELECT b.*, 
        r.departure_time, r.arrival_time, r.duration_mins, r.fare,
        bus.bus_number, bus.bus_type, bus.amenities,
        fs.name AS from_station, fs.city AS from_city,
        ts.name AS to_station, ts.city AS to_city
      FROM bookings b
      JOIN routes r ON b.route_id = r.id
      JOIN buses bus ON r.bus_id = bus.id
      JOIN bus_stations fs ON r.from_station_id = fs.id
      JOIN bus_stations ts ON r.to_station_id = ts.id
      WHERE b.booking_ref = ?
    `).get(bookingRef.toUpperCase());

    if (!bk) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Check authorization: either the authenticated user owns it, or it was matched by ref (public lookup)
    // For guest bookings we allow lookup by ref
    if (bk.user_id && req.user && bk.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this booking.' });
    }

    res.json({
      booking: {
        booking_ref: bk.booking_ref,
        journey_date: bk.journey_date,
        seats: JSON.parse(bk.seats),
        num_passengers: bk.num_passengers,
        total_fare: bk.total_fare,
        fare_per_seat: bk.fare,
        status: bk.status,
        payment_status: bk.payment_status,
        payment_id: bk.payment_id,
        passenger_details: JSON.parse(bk.passenger_details),
        departure_time: bk.departure_time,
        arrival_time: bk.arrival_time,
        duration_mins: bk.duration_mins,
        bus_number: bk.bus_number,
        bus_type: bk.bus_type,
        amenities: JSON.parse(bk.amenities),
        from_station: bk.from_station,
        from_city: bk.from_city,
        to_station: bk.to_station,
        to_city: bk.to_city,
        guest_name: bk.guest_name,
        guest_email: bk.guest_email,
        guest_phone: bk.guest_phone,
        created_at: bk.created_at,
      },
    });
  } catch (err) {
    console.error('Get booking error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/bookings/:bookingRef/cancel — cancel a booking
router.post('/bookings/:bookingRef/cancel', optionalAuth, (req, res) => {
  try {
    const { bookingRef } = req.params;
    const db = getDb();

    const bk = db.prepare(`
      SELECT b.*, r.departure_time, r.fare
      FROM bookings b
      JOIN routes r ON b.route_id = r.id
      WHERE b.booking_ref = ?
    `).get(bookingRef.toUpperCase());

    if (!bk) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (bk.status !== 'confirmed') {
      return res.status(400).json({ error: `Cannot cancel a booking with status: ${bk.status}.` });
    }

    // Check authorization
    if (bk.user_id && req.user && bk.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this booking.' });
    }

    // Calculate refund based on time before departure
    const [depH, depM] = bk.departure_time.split(':').map(Number);
    const departureDateTime = new Date(bk.journey_date + 'T00:00:00');
    departureDateTime.setHours(depH, depM, 0, 0);

    const now = new Date();
    const hoursUntilDeparture = (departureDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    let refundNote = '';

    if (hoursUntilDeparture > 12) {
      refundPercentage = 90;
      refundNote = 'Cancelled more than 12 hours before departure. 90% refund.';
    } else if (hoursUntilDeparture >= 4) {
      refundPercentage = 75;
      refundNote = 'Cancelled 4-12 hours before departure. 75% refund.';
    } else {
      refundPercentage = 0;
      refundNote = 'Cancelled less than 4 hours before departure. No refund.';
    }

    const refundAmount = (bk.total_fare * refundPercentage) / 100;

    // Update in transaction
    db.transaction(() => {
      db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE booking_ref = ?`).run(bookingRef.toUpperCase());

      db.prepare(`UPDATE seat_inventory SET status = 'available', booking_id = NULL WHERE booking_id = ?`).run(bk.id);
    })();

    res.json({
      message: 'Booking cancelled successfully.',
      booking_ref: bk.booking_ref,
      refund_percentage: refundPercentage,
      refund_amount: refundAmount,
      total_fare: bk.total_fare,
      note: refundNote,
    });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
