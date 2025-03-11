const { Pool } = require('pg');
const fs = require('fs');

// Directly providing the connection configuration (no .env)
const pool = new Pool({
  user: 'postgres',           // Username
  host: 'localhost',          // Assuming local database, change if needed
  database: 'postgres',       // Database name
  password: '12345',          // Password
  port: 5432,                 // Default PostgreSQL port
});

// Function to test the database connection
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW();');
    console.log('Database connected!');
  } catch (err) {
    console.error('Database connection error:', err);
    throw err; // Re-throw to stop further execution
  }
}

// Function to create the stores table
async function createStores() {
  const createStoreTable = `
    CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE,
      district VARCHAR(255),
      url VARCHAR(255),
      hours VARCHAR(255),
      rating DECIMAL
    );
  `;
  try {
    await pool.query(createStoreTable);
    console.log('Stores table created (if not exists).');
  } catch (err) {
    console.error('Error creating table:', err);
    throw err; // Re-throw to stop further execution
  }
}

// Function to insert stores into the database
async function insertStores() {
  try {
    // Read the stores.json file
    const data = fs.readFileSync('stores.json', 'utf8');

    // Parse the JSON data
    const stores = JSON.parse(data);

    // Loop through the stores and insert them into the database
    for (const store of stores) {
      const query = `
        INSERT INTO stores (name, district, url, hours, rating)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name) DO NOTHING;
      `;
      const values = [store.name, store.district, store.url, store.hours, store.rating];

      // Execute the query using the pool
      await pool.query(query, values);
      console.log('Inserted store:', store.name);
    }
  } catch (err) {
    console.error('Error inserting stores:', err);
    throw err; // Re-throw to handle the error properly
  } finally {
    // Close the pool connection when done
    await pool.end();
    console.log('Pool connection closed.');
  }
}

// Main function to connect to the database, create the table, and insert stores
async function main() {
  try {
    await testConnection(); // Test connection first
    await createStores(); // Create the stores table
    await insertStores(); // Insert stores after table is created
  } catch (err) {
    console.error('Error during execution:', err);
  }
}

// Run the main function
main();