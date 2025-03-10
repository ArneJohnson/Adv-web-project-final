let currentStoreName = '';

// Load stores and render them in the list
async function loadStores() {
    const response = await fetch("http://localhost:5000/api/stores");
    const stores = await response.json();

    const venueList = document.getElementById("venue-list");
    venueList.innerHTML = '';  // Clear the list before rendering

    stores.forEach(store => {
        const li = document.createElement("li");
        li.classList.add("venue-item");

        li.innerHTML = `
            <span onclick="editStore('${store.name}')">${store.name} - ${store.district}</span>
            <button onclick="editStore('${store.name}')">Details</button>
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
        loadStores(); // Reload the stores after adding a new one
        cancelAddStore(); // Hide the form
        window.location.href = 'index.html'; // Redirect to the index page after adding a store
    } else {
        alert('Error adding store');
    }
}

// Edit an existing store
async function editStore(storeName) {
    console.log(`Editing store: ${storeName}`); // Log store name
    const response = await fetch(`http://localhost:5000/api/stores/${storeName}`);
    const store = await response.json();

    // Clear store list and render the specific store details
    const venueList = document.getElementById("container");
    venueList.innerHTML = '';  // Clear the list before rendering
    storeDetails(storeName);

    // Populate the form fields with the store's current data
    document.getElementById("edit-store-name").value = store.name;
    document.getElementById("edit-store-location").value = store.district || '';
    document.getElementById("edit-store-address").value = store.address || '';
    document.getElementById("edit-store-hours").value = store.hours || '';
    document.getElementById("edit-store-rating").value = store.rating || '';

    // Change the form title and store name
    document.getElementById("edit-form-title").innerText = "Edit Store";
    currentStoreName = storeName; // Store the name of the store being edited

    // Make the form visible
    document.getElementById("edit-store-form").style.display = 'block'; // Show the form
}

// Save the edited store
async function saveStore() {
    const name = document.getElementById("store-name").value;
    const location = document.getElementById("store-location").value;
    const address = document.getElementById("store-address").value;
    const hours = document.getElementById("store-hours").value;
    const rating = document.getElementById("store-rating").value;

    const updatedStore = { name, district: location, address, hours, rating };

    const response = await fetch(`http://localhost:5000/api/stores/${currentStoreName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStore),
    });

    if (response.ok) {
        loadStores(); // Reload the stores after updating
        cancelAddStore(); // Hide the form
    } else {
        alert('Error updating store');
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
            loadStores(); // Reload stores after deletion
        } else {
            alert('Error deleting store');
        }
    }
}

// Hide the form for adding/editing a store
function cancelAddStore() {
    document.getElementById("add-store-form").style.display = 'none';
    document.getElementById("store-name").value = '';
    document.getElementById("store-location").value = '';
    document.getElementById("store-address").value = '';
    document.getElementById("store-hours").value = '';
    document.getElementById("store-rating").value = '';
}

// Open the form for adding a new store
document.getElementById("add-store-btn").addEventListener("click", function () {
    currentStoreName = '';
    document.getElementById("form-title").innerText = "Add a New Store";
    document.getElementById("add-store-form").style.display = 'block';
});

// Load stores when the page is loaded
loadStores();