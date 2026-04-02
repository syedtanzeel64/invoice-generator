const { createClient } = require('@libsql/client');
try { require('dotenv').config(); } catch (e) { /* .env not needed on Vercel */ }

const url = process.env.TURSO_DATABASE_URL || 'file:database.sqlite';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

// Wrapper to maintain compatibility with existing sqlite3 calls in server.js
const db = {
  run: async (sql, params = [], callback) => {
    try {
      const result = await client.execute({ sql, args: params });
      if (callback) callback.call({ lastID: result.lastInsertRowid }, null);
      return result;
    } catch (err) {
      if (callback) callback(err);
      throw err;
    }
  },
  get: async (sql, params = [], callback) => {
    try {
      const result = await client.execute({ sql, args: params });
      const row = result.rows[0];
      if (callback) callback(null, row);
      return row;
    } catch (err) {
      if (callback) callback(err);
      throw err;
    }
  },
  all: async (sql, params = [], callback) => {
    try {
      const result = await client.execute({ sql, args: params });
      if (callback) callback(null, result.rows);
      return result.rows;
    } catch (err) {
      if (callback) callback(err);
      throw err;
    }
  }
};

// Initial Schema Setup
const initDb = async () => {
    try {
        await client.execute(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);

        await client.execute(`CREATE TABLE IF NOT EXISTS invoices (
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
            subtotal REAL,
            discount_rate REAL,
            tax_rate REAL,
            tax_amount REAL,
            total REAL,
            items_json TEXT,
            logo_url TEXT,
            amount_paid REAL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
        
        console.log('Database initialized successfully (Turso/libSQL)');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

initDb();

module.exports = db;
