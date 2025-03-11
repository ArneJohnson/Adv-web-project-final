const express = require('express');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const {pool} = require('./models/model.js');

const SECRET = 'mySecretCookieToken';
const sessions = {};

app.use(cookieParser(SECRET));

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files (index.html, styles.css, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Login Route
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><title>Login</title></head><body><h1>Login</h1>
<form method="POST" action="/login">
<label for="username">Username:</label>
<input type="text" name="username" id="username" required /><br/><br/>
<label for="password">Password:</label>
<input type="password" name="password" id="password" required /><br/><br/>
<button type="submit">Login</button>
</form><p><a href="/">Home</a></p></body></html>`);
});

app.post('/login', express.urlencoded({ extended: true }), (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password') {
        const token = crypto.randomBytes(64).toString('hex');
        sessions[token] = { username };
        res.cookie('authToken', token, { signed: true, httpOnly: true });
        res.redirect('/');
    } else {
        res.status(401).send('Login Error: Invalid credentials.');
    }
});

// GET endpoint to fetch all stores from the database
app.get('/api/stores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM stores');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching stores:', err);
        res.status(500).json({ message: 'Failed to fetch stores' });
    }
});

// POST endpoint to add a new store to the database
app.post('/api/stores', async (req, res) => {
    const { name, district, url, hours, rating } = req.body;

    if (!name || !district) {
        return res.status(400).json({ message: 'Name and location are required!' });
    }

    const query = `
        INSERT INTO stores (name, district, url, hours, rating)
        VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const values = [name, district, url, hours, rating];

    try {
        const result = await pool.query(query, values);
        const newStore = result.rows[0]; // Get the inserted store object
        console.log('New store added:', newStore);
        res.status(201).json(newStore);
    } catch (err) {
        console.error('Error adding store:', err);
        res.status(500).json({ message: 'Failed to add store' });
    }
});

// PUT endpoint to update an existing store by name
app.put('/api/stores/:name', async (req, res) => {
    const storeName = req.params.name;
    const updatedData = req.body;

    const query = `
        UPDATE stores
        SET name = $1, district = $2, url = $3, hours = $4, rating = $5
        WHERE name = $6 RETURNING *;
    `;
    const values = [
        updatedData.name || storeName, 
        updatedData.district, 
        updatedData.url, 
        updatedData.hours, 
        updatedData.rating, 
        storeName
    ];

    try {
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Store not found!' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating store:', err);
        res.status(500).json({ message: 'Failed to update store' });
    }
});

// DELETE endpoint to remove a store by name
app.delete('/api/stores/:name', async (req, res) => {
    const storeName = req.params.name;

    const query = `
        DELETE FROM stores
        WHERE name = $1 RETURNING *;
    `;
    const values = [storeName];

    try {
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Store not found!' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error deleting store:', err);
        res.status(500).json({ message: 'Failed to delete store' });
    }
});

// Start the server
app.listen(5000, () => {
    console.log('Server running at http://localhost:5000');
});
