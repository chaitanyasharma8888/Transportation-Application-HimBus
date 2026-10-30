const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'himbus.db');

let dbInstance = null;
let dbReady = null; // promise that resolves when DB is ready

function saveDb() {
  if (dbInstance) {
    const data = dbInstance.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

// Initialize the database (call once at startup, then getDb() is sync-safe)
async function initDb() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(buffer);
  } else {
    dbInstance = new SQL.Database();
  }

  createTables();
  return dbInstance;
}

// Lazy initializer — returns a promise the first time, then instant
function ensureDb() {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (!dbReady) {
    dbReady = initDb();
  }
  return dbReady;
}

function createTables() {
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS bus_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT DEFAULT 'Himachal Pradesh'
    )
  `);
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS buses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_number TEXT NOT NULL UNIQUE,
      bus_type TEXT NOT NULL CHECK(bus_type IN ('Ordinary','Deluxe','Semi-Luxury','Volvo AC','Electric')),
      total_seats INTEGER NOT NULL DEFAULT 40,
      layout TEXT NOT NULL DEFAULT '2x2',
      amenities TEXT DEFAULT '[]'
    )
  `);
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_station_id INTEGER NOT NULL REFERENCES bus_stations(id),
      to_station_id INTEGER NOT NULL REFERENCES bus_stations(id),
      bus_id INTEGER NOT NULL REFERENCES buses(id),
      fare REAL NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      duration_mins INTEGER NOT NULL,
      days_of_week TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6',
      is_active INTEGER DEFAULT 1
    )
  `);
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_ref TEXT UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id),
      guest_name TEXT,
      guest_email TEXT,
      guest_phone TEXT,
      route_id INTEGER NOT NULL REFERENCES routes(id),
      journey_date TEXT NOT NULL,
      seats TEXT NOT NULL,
      num_passengers INTEGER NOT NULL,
      total_fare REAL NOT NULL,
      status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled','completed')),
      payment_id TEXT,
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','refunded')),
      passenger_details TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS seat_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL REFERENCES routes(id),
      journey_date TEXT NOT NULL,
      seat_number INTEGER NOT NULL,
      status TEXT DEFAULT 'available' CHECK(status IN ('available','booked','blocked')),
      booking_id INTEGER REFERENCES bookings(id),
      UNIQUE(route_id, journey_date, seat_number)
    )
  `);
  saveDb();
}

// ─── Wrapper that mimics better-sqlite3 API ───────────────────────────────────
// So the rest of the codebase doesn't need rewriting.
class DbWrapper {
  constructor(rawDb) {
    this._db = rawDb;
    this._inTransaction = false; // flag to suppress saveDb() inside transactions
  }

  prepare(sql) {
    const rawDb = this._db;
    const wrapper = this; // reference to check _inTransaction flag
    return {
      run(...params) {
        rawDb.run(sql, params);
        // Get rowid/changes BEFORE any potential export (export resets counters)
        const idRow = rawDb.exec('SELECT last_insert_rowid() AS id');
        const chgRow = rawDb.exec('SELECT changes() AS c');
        const lastInsertRowid = idRow.length ? idRow[0].values[0][0] : 0;
        const changes = chgRow.length ? chgRow[0].values[0][0] : 0;
        // Only persist to disk if NOT inside a transaction
        // (transaction commits with saveDb() at the COMMIT step)
        if (!wrapper._inTransaction) {
          saveDb();
        }
        return { lastInsertRowid, changes };
      },
      get(...params) {
        let stmt;
        try {
          stmt = rawDb.prepare(sql);
          if (params.length) stmt.bind(params);
          if (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            const obj = {};
            cols.forEach((c, i) => (obj[c] = vals[i]));
            return obj;
          }
          return undefined;
        } finally {
          if (stmt) stmt.free();
        }
      },
      all(...params) {
        let stmt;
        try {
          stmt = rawDb.prepare(sql);
          if (params.length) stmt.bind(params);
          const results = [];
          const cols = stmt.getColumnNames();
          while (stmt.step()) {
            const vals = stmt.get();
            const obj = {};
            cols.forEach((c, i) => (obj[c] = vals[i]));
            results.push(obj);
          }
          return results;
        } finally {
          if (stmt) stmt.free();
        }
      },
    };
  }

  exec(sql) {
    this._db.run(sql);
    if (!this._inTransaction) {
      saveDb();
    }
  }

  transaction(fn) {
    const self = this;
    return function (...args) {
      self._db.run('BEGIN TRANSACTION');
      self._inTransaction = true;
      try {
        const result = fn.apply(null, args);
        self._db.run('COMMIT');
        self._inTransaction = false;
        saveDb(); // persist once after all writes are committed
        return result;
      } catch (e) {
        self._db.run('ROLLBACK');
        self._inTransaction = false;
        throw e;
      }
    };
  }
}

let wrapper = null;

// getDb() — returns the wrapper synchronously (DB must be initialized first)
function getDb() {
  if (!wrapper) {
    if (!dbInstance) throw new Error('Database not initialized. Call ensureDb() first.');
    wrapper = new DbWrapper(dbInstance);
  }
  return wrapper;
}

module.exports = { getDb, ensureDb, saveDb };
