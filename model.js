const { Pool } = require("pg");
const fs = require('fs');
require('dotenv').config(); // Load environment variables from .env file

// Create a new PostgreSQL connection pool
const pool = new Pool({
    host: "database",  // Use the service name from docker-compose.yml
    port: 5432,        // Port for PostgreSQL
    user: "postgres",  // PostgreSQL username
    password: "12345", // PostgreSQL password
    database: "postgres" // PostgreSQL database name
});

async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW();");
    console.log("Database connected!");
  } catch (err) {
    console.error("Database connection error:", err);
  }
}

// Function to insert stores into the database
async function insertStores() {
  try {
    // Read the stores.json file (updated path)
    const data = fs.readFileSync('/usr/src/app/stores.json', 'utf8');

    // Parse the JSON data
    const stores = JSON.parse(data);

    // Loop through the stores and insert them into the database
    for (const store of stores) {
      const query = `
        INSERT INTO stores (name, district, url, hours, rating)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name) DO NOTHING;
      `;
      const values = [store.name, store.district, store.address, store.hours, store.rating];

      // Execute the query using the pool
      await pool.query(query, values);
      console.log('Inserted store:', store.name);
    }
  } catch (err) {
    console.error('Error inserting stores:', err);
  } finally {
    // Close the pool connection when done
    await pool.end();
  }
}

// Test the connection and then insert stores
testConnection().then(() => {
  insertStores();
});