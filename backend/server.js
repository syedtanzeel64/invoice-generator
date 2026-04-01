const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'super_secret_jwt_key_for_this_demo'; // In prod, use environment variables

app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  });
});

// Create Invoice
app.post('/api/invoices', authenticateToken, (req, res) => {
  const {
    invoice_number, client_name, client_address, client_phone, client_email,
    company_name, company_address, company_phone, company_email,
    date_issued, subtotal, discount_rate, tax_rate, tax_amount, total, items_json, logo_url, amount_paid
  } = req.body;

  db.run(`INSERT INTO invoices (
      user_id, invoice_number, client_name, client_address, client_phone, client_email,
      company_name, company_address, company_phone, company_email,
      date_issued, subtotal, discount_rate, tax_rate, tax_amount, total, items_json, logo_url, amount_paid
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [
      req.user.id, invoice_number, client_name, client_address, client_phone, client_email,
      company_name, company_address, company_phone, company_email,
      date_issued, subtotal, discount_rate, tax_rate, tax_amount, total, JSON.stringify(items_json || []), logo_url || '', amount_paid || 0
    ], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
  });
});

// Get User Invoices
app.get('/api/invoices', authenticateToken, (req, res) => {
  db.all('SELECT * FROM invoices WHERE user_id = ? ORDER BY id DESC', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Parse items_json
    const invoices = rows.map(row => ({
      ...row,
      items_json: JSON.parse(row.items_json || '[]')
    }));
    
    res.json(invoices);
  });
});

// Get Single Invoice
app.get('/api/invoices/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM invoices WHERE user_id = ? AND id = ?', [req.user.id, req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Invoice not found' });
    
    row.items_json = JSON.parse(row.items_json || '[]');
    res.json(row);
  });
});

// Update Invoice
app.put('/api/invoices/:id', authenticateToken, (req, res) => {
  const {
    invoice_number, client_name, client_address, client_phone, client_email,
    company_name, company_address, company_phone, company_email,
    date_issued, subtotal, discount_rate, tax_rate, tax_amount, total, items_json, logo_url, amount_paid
  } = req.body;

  db.run(`UPDATE invoices SET
      invoice_number=?, client_name=?, client_address=?, client_phone=?, client_email=?,
      company_name=?, company_address=?, company_phone=?, company_email=?,
      date_issued=?, subtotal=?, discount_rate=?, tax_rate=?, tax_amount=?, total=?, items_json=?, logo_url=?, amount_paid=?
    WHERE user_id = ? AND id = ?`, 
    [
      invoice_number, client_name, client_address, client_phone, client_email,
      company_name, company_address, company_phone, company_email,
      date_issued, subtotal, discount_rate, tax_rate, tax_amount, total, JSON.stringify(items_json || []), logo_url || '', amount_paid || 0,
      req.user.id, req.params.id
    ], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Invoice not found or no permission' });
      res.json({ message: 'Updated successfully' });
  });
});

// Delete Invoice
app.delete('/api/invoices/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM invoices WHERE user_id = ? AND id = ?', [req.user.id, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Invoice not found or no permission' });
    res.json({ message: 'Deleted successfully' });
  });
});

app.listen(PORT, () => {
  console.log('Server listening on http://localhost:' + PORT);
});
