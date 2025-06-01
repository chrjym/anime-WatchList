const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',        
  host: 'localhost',
  database: 'postgres',    
  password: 'root123',     
  port: 5432,
});

// Register endpoint
app.post('/users/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, password]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ message: 'Registration failed. Email may already exist.' });
  }
});

// Login endpoint
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, email FROM users WHERE email=$1 AND password=$2',
      [email, password]
    );
    if (result.rows.length > 0) {
      res.json({ user: result.rows[0] });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all watchlist items for a user (per-user only)
app.get('/watchlist/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM watchlist WHERE user_id = $1 ORDER BY id ASC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get watchlist error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new anime to the watchlist (per-user)
app.post('/watchlist', async (req, res) => {
  const { user_id, title, status, rating } = req.body;
  if (!user_id || !title || !status) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  try {
    // Prevent duplicate titles for the same user
    const duplicate = await pool.query(
      'SELECT * FROM watchlist WHERE user_id = $1 AND LOWER(title) = LOWER($2)',
      [user_id, title]
    );
    if (duplicate.rows.length > 0) {
      return res.status(400).json({ message: 'This anime is already in your watchlist.' });
    }

    const result = await pool.query(
      'INSERT INTO watchlist (user_id, title, status, rating) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, title, status, rating]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Add watchlist error:', err);
    res.status(400).json({ message: 'Failed to add anime to watchlist.' });
  }
});

// Update an anime in the watchlist (per-user)
app.put('/watchlist/:id', async (req, res) => {
  const { id } = req.params;
  const { title, status, rating } = req.body;
  if (!title || !status) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  try {
    const result = await pool.query(
      'UPDATE watchlist SET title = $1, status = $2, rating = $3 WHERE id = $4 RETURNING *',
      [title, status, rating, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Anime not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update watchlist error:', err);
    res.status(400).json({ message: 'Failed to update anime.' });
  }
});

// Delete an anime from the watchlist (per-user)
app.delete('/watchlist/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM watchlist WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Anime not found.' });
    }
    res.json({ message: 'Anime deleted.' });
  } catch (err) {
    console.error('Delete watchlist error:', err);
    res.status(400).json({ message: 'Failed to delete anime.' });
  }
});

// Always return JSON for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.listen(5000, () => console.log('Server running on port 5000'));
