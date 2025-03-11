let currentStoreName = '';

// Load stores and render them in the list
async function loadStores() {
    const response = await fetch("/api/stores");
    if (!response.ok) {
        console.error("Failed to load stores:", response.statusText);
        return;
    }

    const stores = await response.json();

    getAdminMenu(); // Check if the user is logged in and add the admin menu

    // Sort stores
    const sortMethod = checkSort();
    console.log("Sort method:", sortMethod); // Log the sort method to debug
    if (sortMethod === "rating") {
        stores.sort((a, b) => b.rating - a.rating);
    } else if (sortMethod === "name") {
        stores.sort((a, b) => a.name.localeCompare(b.name));
    }

    console.log("Stores after sorting:", stores); // Log stores after sorting

    const venueList = document.getElementById("venue-list");
    venueList.innerHTML = '';  // Clear the list before rendering

    const editForm = document.getElementById("edit-store-form");
    editForm.style.display = 'none'; // Hide the form

    const nameHeader = document.getElementById("name-header");
    nameHeader.innerText = '';
    nameHeader.style.display = 'none'; // Hide the store name

    stores.forEach(store => {
        const li = document.createElement("li");
        li.classList.add("venue-item");

        li.innerHTML = `
            <span onclick="editStore('${store.name}');">${store.name} ${store.district ? '- ' + store.district : ''}</span>
            <button onclick="deleteStore('${store.name}')">Delete</button>
        `;

        venueList.appendChild(li);
    });
}

// Add a new store
async function addStore() {
    const name = document.getElementById("store-name").value;
    const location = document.getElementById("store-location").value;
    const address = document.getElementById("store-address").value;
    const hours = document.getElementById("store-hours").value;
    const rating = document.getElementById("store-rating").value;

    const newStore = { name, district: location, address, hours, rating };

    const response = await fetch("http://localhost:5000/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStore),
    });

    if (response.ok) {
        loadStores();  // Reload the stores after adding a new one
        window.location.href = 'index.html';  // Redirect to the index page after adding a store
    } else {
        alert('Error adding store');
    }
}

// Edit an existing store
async function editStore(storeName) {
    console.log(`Editing store: ${storeName}`);
    const response = await fetch(`http://localhost:5000/api/stores/${storeName}`, {
        method: "GET",
    });

    if (response.ok) {
        const store = await response.json();

        currentStoreName = storeName;  // Store the current store name

        const venueList = document.getElementById("venue-list");
        venueList.innerHTML = '';  // Clear the list before rendering

        const editForm = document.getElementById("edit-store-form");
        editForm.style.display = 'block';  // Show the form

        const nameHeader = document.getElementById("name-header");
        nameHeader.innerText = `${storeName}`;
        nameHeader.style.display = 'block';  // Show the store name

        const storeHeader = document.getElementById("store-header");
        storeHeader.style.display = 'none';  // Hide the store header

        const addStoreButton = document.getElementById("add-store-btn");
        addStoreButton.style.display = 'none';  // Hide the add store button

        // Populate the form fields with the store's current data
        document.getElementById("edit-store-name").value = store.name;
        document.getElementById("edit-store-location").value = store.district || '';
        document.getElementById("edit-store-address").value = store.address || '';
        document.getElementById("edit-store-hours").value = store.hours || '';
        document.getElementById("edit-store-rating").value = store.rating || '';
    } else {
        if (response.status === 401) {
            alert('Login required to edit a store');
        } else {
            alert('Error editing store', response);
        }
    }
}

// Save the edited store
async function saveStore() {
    const name = document.getElementById("edit-store-name").value;
    const location = document.getElementById("edit-store-location").value;
    const address = document.getElementById("edit-store-address").value;
    const hours = document.getElementById("edit-store-hours").value;
    const rating = document.getElementById("edit-store-rating").value;

    const updatedStore = { name, location, address, hours, rating };

    const response = await fetch(`http://localhost:5000/api/stores/${currentStoreName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStore),
    });

    if (response.ok) {
        loadStores();  // Reload the stores after updating
    } else {
        if (response.status === 401) {
            alert('Login required to edit a store');
        } else {
            alert('Error updating store', response);
        }
    }
}

// Delete an existing store
async function deleteStore(storeName) {
    const confirmDelete = confirm(`Are you sure you want to delete ${storeName}?`);

    if (confirmDelete) {
        const response = await fetch(`http://localhost:5000/api/stores/${storeName}`, {
            method: "DELETE",
        });

        if (response.ok) {
            loadStores();  // Reload stores after deletion
        } else {
            if (response.status === 401) {
                alert('Login required to delete a store');
            } else {
                alert('Error deleting store');
            }
        }
    }
}

// Open the form for adding a new store
document.getElementById("add-store-btn").addEventListener("click", function () {
    currentStoreName = '';
    document.getElementById("form-title").innerText = "Add a New Store";
    document.getElementById("add-store-form").style.display = 'block';
});

// Store Sorting
function sortByRating() {
    document.getElementById("sortByRating").classList.toggle("active");
    document.getElementById("sortByName").classList.remove("active");
    loadStores();
}

function sortByName() {
    document.getElementById("sortByName").classList.toggle("active");
    document.getElementById("sortByRating").classList.remove("active");
    loadStores();
}

function checkSort() {
    if (document.getElementById("sortByRating").classList.contains("active")) {
        return "rating";
    } else if (document.getElementById("sortByName").classList.contains("active")) {
        return "name";
    } else {
        return null;
    }
}

//Admin menu
async function getAdminMenu() {
    const response = await fetch(`http://localhost:5000/`, {
        method: "POST",
    });

    if (response.status === 401) {
        hideAdminMenu();
    } else {
        showAdminMenu();
    }
}

function showAdminMenu() {
    const addStoreButton = document.getElementById("add-store-btn");
    const logoutButton = document.getElementById("logout-btn");
    const loginButton = document.getElementById("login-btn");
    const adminHelpText = document.getElementById("adminHelp");

    addStoreButton.style.display = 'block';
    logoutButton.style.display = 'block';
    loginButton.style.display = 'none';
    adminHelpText.innerText = '*Click on the stores to edit them';
}
function hideAdminMenu() {
    const addStoreButton = document.getElementById("add-store-btn");
    const logoutButton = document.getElementById("logout-btn");
    const loginButton = document.getElementById("login-btn");
    const adminHelpText = document.getElementById("adminHelp");

    addStoreButton.style.display = 'none';
    logoutButton.style.display = 'none';
    loginButton.style.display = 'block';
    adminHelpText.innerText = '';
}

// Load stores when the page is loaded
loadStores();