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

// Login Route
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #f4f4f4;
            color: #111;
            font-family: "Courier New", Courier, monospace;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }

        .container {
            text-align: center;
            padding: 2rem;
            background: #fff;
            border: 4px solid black;
            box-shadow: 8px 8px 0 black;
            width: 400px;
        }

        h2 {
            font-size: 1.8rem;
            text-transform: uppercase;
            font-weight: 700;
            border-bottom: 4px solid black;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        form {
            display: flex;
            flex-direction: column;
            gap: 15px;
            background: #fff;
            padding: 20px;
            border: 4px solid black;
            box-shadow: 8px 8px 0 black;
            text-align: center;
        }

        input {
            font-family: "Courier New", Courier, monospace;
            font-size: 1rem;
            padding: 10px;
            border: 3px solid black;
            box-shadow: 4px 4px 0 black;
            outline: none;
            width: 100%;
        }

        input:focus {
            border-color: #ffcc00;
            box-shadow: 4px 4px 0 #ffcc00;
        }

        button {
            font-family: "Courier New", Courier, monospace;
            font-size: 1.2rem;
            text-transform: uppercase;
            font-weight: 700;
            background: black;
            color: white;
            border: 4px solid white;
            padding: 12px 24px;
            cursor: pointer;
            box-shadow: 6px 6px 0 black;
            transition: transform 0.1s, background 0.2s, color 0.2s, box-shadow 0.2s;
        }

        button:hover {
            background: #ffcc00;
            color: black;
            transform: translate(-2px, -2px);
            box-shadow: 8px 8px 0 black;
        }

        p {
            margin-top: 35px;
        }

        a {
            text-decoration: none;
            font-weight: bold;
            color: black;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Login</h2>
        <form method="POST" action="/login">
            <label for="username">Username:</label>
            <input type="text" name="username" id="username" required />
            
            <label for="password">Password:</label>
            <input type="password" name="password" id="password" required />
            
            <button type="submit">Login</button>
        </form>
        <a href="/"><p>Home</p></a>
    </div>
</body>
</html>`);
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
        if (!name || !district || !rating) {
            return res.status(400).json({ message: 'Name, district & rating are required!' });
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
            // Update the store in the database
            const result = await pool.query(
                'UPDATE stores SET district = COALESCE($1, district), url = COALESCE($2, url), hours = COALESCE($3, hours), rating = COALESCE($4, rating) WHERE name = $5 RETURNING *',
                [district, url, hours, rating, storeName]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Store not found!' });
            }

            // Respond with the updated store data
            // return res.status(200).json({
            //     message: 'Store successfully updated in database.',
            //     updatedStore: result.rows[0]
            //});
            res.json(result.rows[0]);

        } catch (err) {
            console.error('Error updating store:', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        return res.status(401).send('Login required to update a store');
    }
});

app.delete('/api/stores/:name', async (req, res) => {
    const token = req.signedCookies.authToken;
    if (token && sessions[token]) {
        const storeName = req.params.name;

        try {
            // Log store name being deleted
            console.log('Attempting to delete store with name:', storeName);

            // Check if the store exists before attempting to delete
            const checkStore = await pool.query('SELECT * FROM stores WHERE name = $1', [storeName]);
            if (checkStore.rowCount === 0) {
                console.log('Store not found!');
                return res.status(404).json({ message: 'Store not found!' });
            }

            // Perform deletion
            const result = await pool.query(
                'DELETE FROM stores WHERE name = $1 RETURNING *',
                [storeName]
            );

            // If no rows are deleted, something went wrong
            if (result.rowCount === 0) {
                console.log('No store deleted, check constraints or query.');
                return res.status(500).json({ message: 'Store deletion failed.' });
            }

            // Log the result (deleted store)
            console.log('Store deleted:', result.rows[0]);

            // Return the deleted store
            res.json(result.rows[0]);

            // Double-check by querying again
            const verifyDeletion = await pool.query('SELECT * FROM stores WHERE name = $1', [storeName]);
            if (verifyDeletion.rowCount === 0) {
                console.log('Store successfully deleted from database.');
            } else {
                console.log('Store still exists after delete operation.');
            }
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