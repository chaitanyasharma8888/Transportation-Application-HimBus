const express = require('express');
const { getDb } = require('../database/setup');

const router = express.Router();

// GET /api/stations — return all stations, optionally filtered by ?q=
router.get('/stations', (req, res) => {
  try {
    const db = getDb();
    const q = req.query.q;

    let stations;
    if (q && q.trim()) {
      const search = `%${q.trim()}%`;
      stations = db.prepare(
        'SELECT id, name, city, state FROM bus_stations WHERE name LIKE ? OR city LIKE ? ORDER BY city'
      ).all(search, search);
    } else {
      stations = db.prepare('SELECT id, name, city, state FROM bus_stations ORDER BY city').all();
    }

    res.json({ stations });
  } catch (err) {
    console.error('Stations error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/search — search for routes
router.get('/search', (req, res) => {
  try {
    const { from_station_id, to_station_id, date, bus_type, sort_by } = req.query;

    if (!from_station_id || !to_station_id || !date) {
      return res.status(400).json({ error: 'from_station_id, to_station_id, and date are required.' });
    }

    if (from_station_id === to_station_id) {
      return res.status(400).json({ error: 'From and To stations must be different.' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format.' });
    }

    const journeyDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (journeyDate < today) {
      return res.status(400).json({ error: 'Journey date cannot be in the past.' });
    }

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 60);
    if (journeyDate > maxDate) {
      return res.status(400).json({ error: 'Cannot book more than 60 days in advance.' });
    }

    // Day of week (0=Sun, 6=Sat)
    const dayOfWeek = journeyDate.getDay();

    const db = getDb();

    // Find routes matching from/to stations that run on this day
    const routes = db.prepare(`
      SELECT 
        r.id AS route_id,
        r.fare,
        r.departure_time,
        r.arrival_time,
        r.duration_mins,
        r.days_of_week,
        b.id AS bus_id,
        b.bus_number,
        b.bus_type,
        b.total_seats,
        b.layout,
        b.amenities,
        fs.id AS from_station_id,
        fs.name AS from_station,
        fs.city AS from_city,
        ts.id AS to_station_id,
        ts.name AS to_station,
        ts.city AS to_city
      FROM routes r
      JOIN buses b ON r.bus_id = b.id
      JOIN bus_stations fs ON r.from_station_id = fs.id
      JOIN bus_stations ts ON r.to_station_id = ts.id
      WHERE r.from_station_id = ?
        AND r.to_station_id = ?
        AND r.is_active = 1
    `).all(from_station_id, to_station_id);

    // Filter by day of week
    let filtered = routes.filter(r => {
      const days = r.days_of_week.split(',').map(Number);
      return days.includes(dayOfWeek);
    });

    // Filter out buses departing within 4 hours if journey_date is today
    const isToday = date === today.toISOString().split('T')[0];
    if (isToday) {
      const now = new Date();
      const cutoffMs = now.getTime() + 4 * 60 * 60 * 1000;
      filtered = filtered.filter(r => {
        const [h, m] = r.departure_time.split(':').map(Number);
        const depDate = new Date(journeyDate);
        depDate.setHours(h, m, 0, 0);
        return depDate.getTime() > cutoffMs;
      });
    }

    // Filter by bus_type if provided
    if (bus_type) {
      filtered = filtered.filter(r => r.bus_type === bus_type);
    }

    // For each route, calculate available seats
    const results = filtered.map(r => {
      const bookedCount = db.prepare(
        `SELECT COUNT(*) AS cnt FROM seat_inventory WHERE route_id = ? AND journey_date = ? AND status = 'booked'`
      ).get(r.route_id, date).cnt;

      const availableSeats = r.total_seats - bookedCount;

      return {
        route_id: r.route_id,
        from_station: { id: r.from_station_id, name: r.from_station, city: r.from_city },
        to_station: { id: r.to_station_id, name: r.to_station, city: r.to_city },
        bus: {
          id: r.bus_id,
          bus_number: r.bus_number,
          bus_type: r.bus_type,
          total_seats: r.total_seats,
          layout: r.layout,
          amenities: JSON.parse(r.amenities),
        },
        fare: r.fare,
        departure_time: r.departure_time,
        arrival_time: r.arrival_time,
        duration_mins: r.duration_mins,
        available_seats: availableSeats,
      };
    });

    // Sort
    const sortField = sort_by || 'departure_time';
    results.sort((a, b) => {
      if (sortField === 'fare') return a.fare - b.fare;
      if (sortField === 'available_seats') return b.available_seats - a.available_seats;
      // default: departure_time
      return a.departure_time.localeCompare(b.departure_time);
    });

    res.json({ results, count: results.length });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/route-fare/:routeId — get fare for a route
router.get('/route-fare/:routeId', (req, res) => {
  try {
    const db = getDb();
    const route = db.prepare('SELECT fare FROM routes WHERE id = ?').get(req.params.routeId);
    if (!route) return res.status(404).json({ error: 'Route not found.' });
    res.json({ fare: route.fare });
  } catch (err) {
    console.error('Route fare error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;

