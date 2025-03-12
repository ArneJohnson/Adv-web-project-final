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
    database: "postgres",
});

module.exports = { pool };


