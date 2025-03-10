let currentStoreName = '';

// Load stores and render them in the list
async function loadStores() {
    const response = await fetch("http://localhost:5000/api/stores");
    const stores = await response.json();

    const venueList = document.getElementById("venue-list");
    venueList.innerHTML = '';  // Clear the list before rendering

    const editForm = document.getElementById("edit-store-form");
    editForm.style.display = 'none'; // Hide the form

    const nameHeader = document.getElementById("name-header");
    nameHeader.innerText = ``;
    nameHeader.style.display = 'none'; // Hide the store name

    const addStoreButton = document.getElementById("add-store-btn");
    addStoreButton.style.display = 'block'; // Show the add store button

    stores.forEach(store => {
        const li = document.createElement("li");
        li.classList.add("venue-item");
        li.onclick = function () {
            editStore(store.name);
        };

        if (store.district !== null) {
            li.innerHTML = `
            <span>${store.name} - ${store.district}</span>
            <button onclick="deleteStore('${store.name}')">Delete</button>
        `;
        } else {
            li.innerHTML = `
            <span>${store.name}</span>
            <button onclick="deleteStore('${store.name}')">Delete</button>
        `;
        }

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
        window.location.href = 'index.html'; // Redirect to the index page after adding a store
    } else {
        alert('Error adding store');
    }
}

// Edit an existing store
async function editStore(storeName) {
    console.log(`Editing store: ${storeName}`); // Log store name
    const response = await fetch(`http://localhost:5000/api/stores/${storeName}`, {
        method: "PUT",
    });

    if (response.ok) {
        const store = await response.json();

        currentStoreName = storeName; // Store the current store name

        const venueList = document.getElementById("venue-list");
        venueList.innerHTML = '';  // Clear the list before rendering

        const editForm = document.getElementById("edit-store-form");
        editForm.style.display = 'block'; // Show the form

        const nameHeader = document.getElementById("name-header");
        nameHeader.innerText = `${storeName}`;
        nameHeader.style.display = 'block'; // Show the store name

        const storeHeader = document.getElementById("store-header");
        storeHeader.style.display = 'none'; // Hide the store header

        const addStoreButton = document.getElementById("add-store-btn");
        addStoreButton.style.display = 'none'; // Hide the add store button

        // Populate the form fields with the store's current data
        console.log(store);
        document.getElementById("edit-store-name").value = store.name;
        document.getElementById("edit-store-location").value = store.district || '';
        document.getElementById("edit-store-address").value = store.address || '';
        document.getElementById("edit-store-hours").value = store.hours || '';
        document.getElementById("edit-store-rating").value = store.rating || '';
    } else {
        alert('Error editing store');
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
        loadStores(); // Reload the stores after updating
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

// Open the form for adding a new store
document.getElementById("add-store-btn").addEventListener("click", function () {
    currentStoreName = '';
    document.getElementById("form-title").innerText = "Add a New Store";
    document.getElementById("add-store-form").style.display = 'block';
});

// Sorting buttons
function sortByRating() {
    document.getElementById("sortByRating").classList.toggle("active");
    document.getElementById("sortByName").classList.remove("active");
}

function sortByName() {
    document.getElementById("sortByName").classList.toggle("active");
    document.getElementById("sortByRating").classList.remove("active");
}

// Load stores when the page is loaded
loadStores();