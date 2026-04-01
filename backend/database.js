const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);

    // Create Invoices table
    db.run(`CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      invoice_number TEXT,
      client_name TEXT,
      client_address TEXT,
      client_phone TEXT,
      client_email TEXT,
      company_name TEXT,
      company_address TEXT,
      company_phone TEXT,
      company_email TEXT,
      date_issued TEXT,
      due_date TEXT,
      subtotal REAL,
      discount_rate REAL,
      tax_rate REAL,
      tax_amount REAL,
      total REAL,
      items_json TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (createErr) => {
        if (!createErr) {
            db.run(`ALTER TABLE invoices ADD COLUMN logo_url TEXT`, (alterErr) => {
                // Ignore error as column might already exist
            });
            db.run(`ALTER TABLE invoices ADD COLUMN amount_paid REAL DEFAULT 0`, (alterErr) => {
                // Ignore error as column might already exist
            });
        }
    });
  }
});

module.exports = db;
