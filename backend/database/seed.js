const { ensureDb, getDb } = require('./setup');

async function seed() {
  await ensureDb();
  const db = getDb();

  // Clear existing data
  db.exec(`DELETE FROM seat_inventory`);
  db.exec(`DELETE FROM bookings`);
  db.exec(`DELETE FROM routes`);
  db.exec(`DELETE FROM buses`);
  db.exec(`DELETE FROM bus_stations`);

  console.log('Cleared existing data.');

  // ── Bus Stations ──────────────────────────────────────────────────────
  const stations = [
    { name: 'Delhi ISBT Kashmere Gate', city: 'Delhi', state: 'Delhi' },
    { name: 'Chandigarh ISBT Sector 43', city: 'Chandigarh', state: 'Chandigarh' },
    { name: 'Shimla ISBT', city: 'Shimla', state: 'Himachal Pradesh' },
    { name: 'Manali Bus Stand', city: 'Manali', state: 'Himachal Pradesh' },
    { name: 'Dharamshala Bus Stand', city: 'Dharamshala', state: 'Himachal Pradesh' },
    { name: 'Kullu Bus Stand', city: 'Kullu', state: 'Himachal Pradesh' },
    { name: 'Mandi Bus Stand', city: 'Mandi', state: 'Himachal Pradesh' },
    { name: 'Hamirpur Bus Stand', city: 'Hamirpur', state: 'Himachal Pradesh' },
    { name: 'Una Bus Stand', city: 'Una', state: 'Himachal Pradesh' },
    { name: 'Bilaspur Bus Stand', city: 'Bilaspur', state: 'Himachal Pradesh' },
    { name: 'Solan Bus Stand', city: 'Solan', state: 'Himachal Pradesh' },
    { name: 'Nahan Bus Stand', city: 'Nahan', state: 'Himachal Pradesh' },
    { name: 'Rampur Bus Stand', city: 'Rampur', state: 'Himachal Pradesh' },
    { name: 'Keylong Bus Stand', city: 'Keylong', state: 'Himachal Pradesh' },
    { name: 'Dalhousie Bus Stand', city: 'Dalhousie', state: 'Himachal Pradesh' },
    { name: 'Haridwar Bus Stand', city: 'Haridwar', state: 'Uttarakhand' },
    { name: 'Dehradun ISBT', city: 'Dehradun', state: 'Uttarakhand' },
  ];

  const stationIds = {};
  for (const s of stations) {
    const info = db.prepare('INSERT INTO bus_stations (name, city, state) VALUES (?, ?, ?)').run(s.name, s.city, s.state);
    stationIds[s.city] = info.lastInsertRowid;
  }
  console.log(`Inserted ${stations.length} bus stations.`);

  // ── Buses ─────────────────────────────────────────────────────────────
  const buses = [
    { bus_number: 'HP-01-1234', bus_type: 'Ordinary', total_seats: 40, layout: '2x2', amenities: [] },
    { bus_number: 'HP-01-5678', bus_type: 'Ordinary', total_seats: 40, layout: '2x2', amenities: [] },
    { bus_number: 'HP-66-1001', bus_type: 'Ordinary', total_seats: 40, layout: '2x2', amenities: [] },
    { bus_number: 'HP-12-3456', bus_type: 'Ordinary', total_seats: 40, layout: '2x2', amenities: [] },
    { bus_number: 'HP-01-2001', bus_type: 'Deluxe', total_seats: 40, layout: '2x2', amenities: ['Cushioned Seats', 'Curtains'] },
    { bus_number: 'HP-66-2002', bus_type: 'Deluxe', total_seats: 40, layout: '2x2', amenities: ['Cushioned Seats', 'Curtains'] },
    { bus_number: 'HP-12-2003', bus_type: 'Deluxe', total_seats: 40, layout: '2x2', amenities: ['Cushioned Seats', 'Curtains'] },
    { bus_number: 'HP-01-2004', bus_type: 'Deluxe', total_seats: 40, layout: '2x2', amenities: ['Cushioned Seats', 'Curtains'] },
    { bus_number: 'HP-01-3001', bus_type: 'Semi-Luxury', total_seats: 36, layout: '2x2', amenities: ['Pushback Seats', 'Charging Point', 'Curtains'] },
    { bus_number: 'HP-66-3002', bus_type: 'Semi-Luxury', total_seats: 36, layout: '2x2', amenities: ['Pushback Seats', 'Charging Point', 'Curtains'] },
    { bus_number: 'HP-01-3003', bus_type: 'Semi-Luxury', total_seats: 36, layout: '2x2', amenities: ['Pushback Seats', 'Charging Point', 'Curtains'] },
    { bus_number: 'HP-12-3004', bus_type: 'Semi-Luxury', total_seats: 36, layout: '2x2', amenities: ['Pushback Seats', 'Charging Point', 'Curtains'] },
    { bus_number: 'HP-01-4001', bus_type: 'Volvo AC', total_seats: 32, layout: '2x2', amenities: ['AC', 'Pushback Seats', 'Charging Point', 'Reading Light', 'Curtains'] },
    { bus_number: 'HP-66-4002', bus_type: 'Volvo AC', total_seats: 32, layout: '2x2', amenities: ['AC', 'Pushback Seats', 'Charging Point', 'Reading Light', 'Curtains'] },
    { bus_number: 'HP-01-4003', bus_type: 'Volvo AC', total_seats: 32, layout: '2x2', amenities: ['AC', 'Pushback Seats', 'Charging Point', 'Reading Light', 'Curtains'] },
    { bus_number: 'HP-12-4004', bus_type: 'Volvo AC', total_seats: 32, layout: '2x2', amenities: ['AC', 'Pushback Seats', 'Charging Point', 'Reading Light', 'Curtains'] },
    { bus_number: 'HP-66-4005', bus_type: 'Volvo AC', total_seats: 32, layout: '2x2', amenities: ['AC', 'Pushback Seats', 'Charging Point', 'Reading Light', 'Curtains'] },
    { bus_number: 'HP-01-5001', bus_type: 'Electric', total_seats: 30, layout: '2x2', amenities: ['AC', 'Eco-friendly', 'USB Charging'] },
    { bus_number: 'HP-66-5002', bus_type: 'Electric', total_seats: 30, layout: '2x2', amenities: ['AC', 'Eco-friendly', 'USB Charging'] },
    { bus_number: 'HP-01-5003', bus_type: 'Electric', total_seats: 30, layout: '2x2', amenities: ['AC', 'Eco-friendly', 'USB Charging'] },
    { bus_number: 'HP-12-5004', bus_type: 'Electric', total_seats: 30, layout: '2x2', amenities: ['AC', 'Eco-friendly', 'USB Charging'] },
  ];

  const busIds = {};
  for (const b of buses) {
    const info = db.prepare('INSERT INTO buses (bus_number, bus_type, total_seats, layout, amenities) VALUES (?, ?, ?, ?, ?)').run(b.bus_number, b.bus_type, b.total_seats, b.layout, JSON.stringify(b.amenities));
    if (!busIds[b.bus_type]) busIds[b.bus_type] = [];
    busIds[b.bus_type].push(info.lastInsertRowid);
  }
  console.log(`Inserted ${buses.length} buses.`);

  // ── Routes ────────────────────────────────────────────────────────────
  const busCounters = {};
  function pickBus(type) {
    if (!busCounters[type]) busCounters[type] = 0;
    const ids = busIds[type];
    const id = ids[busCounters[type] % ids.length];
    busCounters[type]++;
    return id;
  }

  function addMins(time, mins) {
    const [h, m] = time.split(':').map(Number);
    let total = h * 60 + m + mins;
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  }

  const routeData = [
    { from: 'Delhi', to: 'Shimla', dep: '06:00', dur: 540, fare: 450, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Delhi', to: 'Shimla', dep: '20:00', dur: 510, fare: 650, type: 'Deluxe', days: '0,1,2,3,4,5,6' },
    { from: 'Delhi', to: 'Shimla', dep: '21:30', dur: 480, fare: 850, type: 'Semi-Luxury', days: '0,1,2,3,4,5,6' },
    { from: 'Delhi', to: 'Shimla', dep: '22:00', dur: 480, fare: 1200, type: 'Volvo AC', days: '0,1,2,3,4,5,6' },
    { from: 'Shimla', to: 'Delhi', dep: '08:30', dur: 540, fare: 450, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Shimla', to: 'Delhi', dep: '17:00', dur: 510, fare: 650, type: 'Deluxe', days: '0,1,2,3,4,5,6' },
    { from: 'Shimla', to: 'Delhi', dep: '21:00', dur: 480, fare: 1200, type: 'Volvo AC', days: '0,1,2,3,4,5,6' },
    { from: 'Delhi', to: 'Manali', dep: '17:00', dur: 780, fare: 700, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Delhi', to: 'Manali', dep: '20:00', dur: 750, fare: 900, type: 'Deluxe', days: '0,1,2,3,4,5,6' },
    { from: 'Delhi', to: 'Manali', dep: '22:00', dur: 720, fare: 1100, type: 'Semi-Luxury', days: '0,1,2,3,4,5,6' },
    { from: 'Delhi', to: 'Manali', dep: '22:30', dur: 720, fare: 1500, type: 'Volvo AC', days: '0,1,2,3,4,5,6' },
    { from: 'Manali', to: 'Delhi', dep: '08:00', dur: 780, fare: 700, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Manali', to: 'Delhi', dep: '17:00', dur: 750, fare: 900, type: 'Deluxe', days: '0,1,2,3,4,5,6' },
    { from: 'Manali', to: 'Delhi', dep: '22:00', dur: 720, fare: 1500, type: 'Volvo AC', days: '0,1,2,3,4,5,6' },
    { from: 'Shimla', to: 'Manali', dep: '06:00', dur: 480, fare: 350, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Shimla', to: 'Manali', dep: '10:00', dur: 450, fare: 550, type: 'Deluxe', days: '0,1,2,3,5,6' },
    { from: 'Shimla', to: 'Manali', dep: '22:00', dur: 420, fare: 900, type: 'Volvo AC', days: '0,2,4,6' },
    { from: 'Manali', to: 'Shimla', dep: '06:30', dur: 480, fare: 350, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Manali', to: 'Shimla', dep: '14:00', dur: 450, fare: 550, type: 'Deluxe', days: '1,3,5' },
    { from: 'Delhi', to: 'Dharamshala', dep: '19:00', dur: 660, fare: 600, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Delhi', to: 'Dharamshala', dep: '21:00', dur: 630, fare: 900, type: 'Semi-Luxury', days: '0,1,2,3,4,5,6' },
    { from: 'Delhi', to: 'Dharamshala', dep: '22:30', dur: 600, fare: 1400, type: 'Volvo AC', days: '0,1,3,5' },
    { from: 'Dharamshala', to: 'Delhi', dep: '17:00', dur: 660, fare: 600, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Dharamshala', to: 'Delhi', dep: '20:00', dur: 600, fare: 1400, type: 'Volvo AC', days: '0,2,4,6' },
    { from: 'Chandigarh', to: 'Shimla', dep: '06:00', dur: 210, fare: 200, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Chandigarh', to: 'Shimla', dep: '08:30', dur: 200, fare: 350, type: 'Deluxe', days: '0,1,2,3,4,5,6' },
    { from: 'Chandigarh', to: 'Shimla', dep: '14:00', dur: 200, fare: 500, type: 'Volvo AC', days: '0,1,2,3,4,5,6' },
    { from: 'Shimla', to: 'Chandigarh', dep: '07:00', dur: 210, fare: 200, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Shimla', to: 'Chandigarh', dep: '15:00', dur: 200, fare: 350, type: 'Deluxe', days: '0,1,2,3,4,5,6' },
    { from: 'Chandigarh', to: 'Manali', dep: '20:00', dur: 540, fare: 500, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Chandigarh', to: 'Manali', dep: '22:00', dur: 510, fare: 750, type: 'Semi-Luxury', days: '0,1,2,3,4,5,6' },
    { from: 'Chandigarh', to: 'Manali', dep: '23:00', dur: 480, fare: 1100, type: 'Volvo AC', days: '0,2,4,6' },
    { from: 'Manali', to: 'Chandigarh', dep: '08:00', dur: 540, fare: 500, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Shimla', to: 'Kullu', dep: '07:00', dur: 360, fare: 300, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Kullu', to: 'Shimla', dep: '08:00', dur: 360, fare: 300, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Shimla', to: 'Mandi', dep: '09:00', dur: 300, fare: 280, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Mandi', to: 'Shimla', dep: '10:00', dur: 300, fare: 280, type: 'Ordinary', days: '0,1,2,3,4,5,6' },
    { from: 'Delhi', to: 'Dalhousie', dep: '21:00', dur: 720, fare: 800, type: 'Deluxe', days: '0,2,4,6' },
    { from: 'Dalhousie', to: 'Delhi', dep: '18:00', dur: 720, fare: 800, type: 'Deluxe', days: '1,3,5' },
    { from: 'Chandigarh', to: 'Dharamshala', dep: '22:00', dur: 390, fare: 450, type: 'Deluxe', days: '0,1,2,3,4,5,6' },
    { from: 'Dharamshala', to: 'Chandigarh', dep: '06:00', dur: 390, fare: 450, type: 'Deluxe', days: '0,1,2,3,4,5,6' },
    { from: 'Shimla', to: 'Solan', dep: '08:00', dur: 90, fare: 120, type: 'Electric', days: '0,1,2,3,4,5,6' },
    { from: 'Solan', to: 'Shimla', dep: '10:00', dur: 90, fare: 120, type: 'Electric', days: '0,1,2,3,4,5,6' },
    { from: 'Shimla', to: 'Solan', dep: '14:00', dur: 90, fare: 120, type: 'Electric', days: '0,1,2,3,4,5,6' },
    { from: 'Solan', to: 'Shimla', dep: '16:00', dur: 90, fare: 120, type: 'Electric', days: '0,1,2,3,4,5,6' },
    { from: 'Manali', to: 'Keylong', dep: '06:00', dur: 360, fare: 250, type: 'Ordinary', days: '0,2,4,6' },
    { from: 'Keylong', to: 'Manali', dep: '06:00', dur: 360, fare: 250, type: 'Ordinary', days: '1,3,5' },
  ];

  const insertRoute = db.prepare(
    `INSERT INTO routes (from_station_id, to_station_id, bus_id, fare, departure_time, arrival_time, duration_mins, days_of_week, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
  );

  let routeCount = 0;
  for (const r of routeData) {
    const fromId = stationIds[r.from];
    const toId = stationIds[r.to];
    if (!fromId || !toId) {
      console.warn(`Skipping route ${r.from} → ${r.to}: station not found.`);
      continue;
    }
    const busId = pickBus(r.type);
    const arrivalTime = addMins(r.dep, r.dur);
    insertRoute.run(fromId, toId, busId, r.fare, r.dep, arrivalTime, r.dur, r.days);
    routeCount++;
  }
  console.log(`Inserted ${routeCount} routes.`);

  console.log('\nSeed complete!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
