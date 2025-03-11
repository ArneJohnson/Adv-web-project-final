const express = require('express');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const fs = require('fs'); // To read and write the stores.json file
const { pool } = require('./model.js');

const SECRET = 'mySecretCookieToken';
const sessions = {};

// Middleware to parse JSON request bodies
app.use(cookieParser(SECRET));
app.use(express.json());

// Serve static files (index.html, styles.css, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Path to the stores.json file
const storesFilePath = path.join(__dirname, 'stores.json');

// Function to read stores from the JSON file
function readStores() {
    try {
        const data = fs.readFileSync(storesFilePath, 'utf8');
        return JSON.parse(data); // Returns the stores data as an array
    } catch (err) {
        console.error('Error reading stores file:', err);
        return []; // Return an empty array if there's an error
    }
}

// Function to write stores to the JSON file
// function writeStores(stores) {
//     try {
//         fs.writeFileSync(storesFilePath, JSON.stringify(stores, null, 2), 'utf8');
//     } catch (err) {
//         console.error('Error writing stores file:', err);
//     }
// }

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

// Logout
app.get('/logout', (req, res) => {
    const token = req.signedCookies.authToken;
    if (token) {
        delete sessions[token];
    }
    res.clearCookie('authToken');
    res.redirect('/');
});

// Home Route
app.post('/', (req, res) => {
    const token = req.signedCookies.authToken;
    if (token && sessions[token]) {
        res.send(`<!DOCTYPE html><html><head><title>Home</title></head><body><h1>Welcome, ${sessions[token].username}!</h1></body></html>`);
    } else {
        res.status(401).json({ message: 'Login required' });
    }
});

// GET: Fetch all stores
app.get('/api/stores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM stores');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching stores:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST: Add a new store
app.post('/api/stores', async (req, res) => {
    const token = req.signedCookies.authToken;
    if (token && sessions[token]) {
        const { name, district, url, hours, rating } = req.body;
        if (!name || !district) {
            return res.status(400).json({ message: 'Name and district are required!' });
        }
        try {
            const result = await pool.query(
                'INSERT INTO stores (name, district, url, hours, rating) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [name, district, url, hours, rating]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error('Error adding store:', err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.status(401).send('Login required to add a store');
    }
});

// PUT: Update a store by name
app.put('/api/stores/:name', async (req, res) => {
    const token = req.signedCookies.authToken;
    if (token && sessions[token]) {
        const storeName = req.params.name;
        const { district, url, hours, rating } = req.body;

        try {
            const result = await pool.query(
                'UPDATE stores SET district = COALESCE($1, district), url = COALESCE($2, url), hours = COALESCE($3, hours), rating = COALESCE($4, rating) WHERE name = $5 RETURNING *',
                [district, url, hours, rating, storeName]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Store not found!' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error updating store:', err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.status(401).send('Login required to update a store');
    }
});

// DELETE: Remove a store by name
app.delete('/api/stores/:name', async (req, res) => {
    const token = req.signedCookies.authToken;
    if (token && sessions[token]) {
        const storeName = req.params.name;

        try {
            const result = await pool.query(
                'DELETE FROM stores WHERE name = $1 RETURNING *',
                [storeName]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Store not found!' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error deleting store:', err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.status(401).send('Login required to delete a store');
    }
});

// Start server
app.listen(5000, () => {
    console.log('Server running at http://localhost:5000');
});