const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

// Create an Express application
const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// PostgreSQL pool setup
const pool = new Pool({
    host: "database",
    port: 5432,
    user: "postgres",
    password: "12345",
    database: "postgres"
});

// Handle POST request to insert a new store
app.post('/api/stores', async (req, res) => {
    const { name, district, url, hours, rating } = req.body;

    try {
        // Query to insert the store data into the database
        const query = `
            INSERT INTO stores (name, district, url, hours, rating)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (name) DO NOTHING;
        `;
        const values = [name, district, url, hours, rating];

        // Execute the query using the pool
        await pool.query(query, values);
        console.log('Inserted store:', name);

        // Send a response back to the client
        res.status(200).json({ message: 'Store added successfully!' });
    } catch (err) {
        console.error('Error inserting store:', err);
        res.status(500).json({ message: 'Failed to add store. Please try again.' });
    }
});

// Test connection and start the server
async function testConnection() {
    try {
        const res = await pool.query("SELECT NOW();");
        console.log("Database connected!");
    } catch (err) {
        console.error("Database connection error:", err);
    }
}

