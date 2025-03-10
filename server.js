const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const port = 5000;

const SECRET = 'mySecretCookieToken';

const sessions = {};

app.use(cookieParser(SECRET));

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files (index.html, styles.css, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Path to the JSON file (your "database")
const storesFilePath = path.join(__dirname, 'stores.json');

// Helper function to read stores data from the JSON file
function readStores() {
    try {
        const data = fs.readFileSync(storesFilePath);
        return JSON.parse(data);
    } catch (error) {
        // Return an empty array if there's an error reading the file
        return [];
    }
}

// Helper function to write stores data to the JSON file
function writeStores(stores) {
    fs.writeFileSync(storesFilePath, JSON.stringify(stores, null, 2));
}

// Login
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

app.post('/login', express.urlencoded({ extended: true }), (req, res) => { //POST /login route
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password') { // In a real-world validate credentials against a database
        const token = crypto.randomBytes(64).toString('hex'); // Generate a secure random token
        sessions[token] = { username }; // Store the token along with user data in our session store
        res.cookie('authToken', token, { signed: true, httpOnly: true }); // Set a signed, HTTP-only cookie with the token
        res.redirect('/'); // Redirect the user to the default route after successful login
    } else {
        res.status(401).send(`Login Error: Invalid credentials. Please try again.`);
    }
});

// GET endpoint to fetch all stores
app.get('/api/stores', (req, res) => {
    const stores = readStores();
    res.json(stores);
});

// POST endpoint to add a new store
app.post('/api/stores', (req, res) => {
    const newStore = req.body;

    if (!newStore.name || !newStore.district) {
        return res.status(400).json({ message: 'Name and location are required!' });
    }

    const stores = readStores();
    stores.push(newStore);
    writeStores(stores);

    console.log('New store added:', newStore); // Log the added store
    console.log('Stores after adding new store:', stores); // Debugging
    res.status(201).json(newStore);
});


// PUT endpoint to update an existing store by name
app.put('/api/stores/:name', (req, res) => {
    const storeName = req.params.name;
    const updatedData = req.body;

    const stores = readStores();
    const storeIndex = stores.findIndex(store => store.name === storeName);

    if (storeIndex === -1) {
        return res.status(404).json({ message: 'Store not found!' });
    }

    // Update the store
    stores[storeIndex] = { ...stores[storeIndex], ...updatedData };
    writeStores(stores);
    res.json(stores[storeIndex]);
});

// DELETE endpoint to remove a store by name
app.delete('/api/stores/:name', (req, res) => {
    const storeName = req.params.name;
    const stores = readStores();
    const storeIndex = stores.findIndex(store => store.name === storeName);

    if (storeIndex === -1) {
        return res.status(404).json({ message: 'Store not found!' });
    }

    // Remove the store
    const deletedStore = stores.splice(storeIndex, 1);
    writeStores(stores);
    res.json(deletedStore);
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});