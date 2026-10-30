const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

(async () => {
  const SQL = await initSqlJs();
  // Remove old DB
  const dbPath = path.join(__dirname, 'database', 'himbus.db');
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  
  // Use the actual setup module
  const { ensureDb, getDb } = require('./database/setup');
  await ensureDb();
  const db = getDb();
  
  // Test inserting a station
  const info = db.prepare('INSERT INTO bus_stations (name, city, state) VALUES (?, ?, ?)').run('Delhi ISBT', 'Delhi', 'Delhi');
  console.log('Insert result:', JSON.stringify(info));
  console.log('lastInsertRowid:', info.lastInsertRowid);
  
  const info2 = db.prepare('INSERT INTO bus_stations (name, city, state) VALUES (?, ?, ?)').run('Shimla ISBT', 'Shimla', 'HP');
  console.log('Insert result 2:', JSON.stringify(info2));
  console.log('lastInsertRowid 2:', info2.lastInsertRowid);
})();
