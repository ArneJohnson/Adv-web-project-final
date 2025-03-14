let currentStoreName = '';

// Load stores and render them in the list
async function loadStores() {
    try {
        const response = await fetch("/api/stores");
        if (!response.ok) {
            throw new Error(`Failed to load stores: ${response.statusText}`);
        }

        const stores = await response.json();
        console.log("Stores loaded:", stores);

        getAdminMenu(); // Check if the user is logged in and add the admin menu

        // Sort stores
        const sortMethod = checkSort();
        console.log("Sort method:", sortMethod);
        if (sortMethod === "rating") {
            stores.sort((a, b) => b.rating - a.rating);
        } else if (sortMethod === "name") {
            stores.sort((a, b) => a.name.localeCompare(b.name));
        }

        console.log("Stores after sorting:", stores);

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
                <button class="delete-btn" onclick="deleteStore('${store.name}')">Delete</button>
            `;

            venueList.appendChild(li);
        });
    } catch (error) {
        console.error(error.message);  // Handle errors gracefully
    }
}

// Add a new store
async function addStore() {
    const name = document.getElementById("store-name").value;
    const location = document.getElementById("store-location").value;
    const address = document.getElementById("store-address").value;
    const hours = document.getElementById("store-hours").value;
    const rating = document.getElementById("store-rating").value;

    const newStore = { name, district: location, address, hours, rating };

    try {
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
    } catch (error) {
        console.error("Error adding store:", error);
    }
}

// Edit an existing store
async function editStore(storeName) {
    console.log(`Editing store: ${storeName}`);
    console.log("Store name:", storeName);
    try {
        const response = await fetch(`http://localhost:5000/api/stores/${storeName}`, {
            method: "PUT",
        });

        if (response.ok) {
            const store = await response.json();
            console.log(store);

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
            document.getElementById("edit-store-address").value = store.url || '';
            document.getElementById("edit-store-hours").value = store.hours || '';
            document.getElementById("edit-store-rating").value = store.rating || ''; //prevents undefined or null from being assigned
        } else {
            if (response.status === 401) {
                alert('Login required to edit a store');
            } else {
                alert('Error editing store', response);
            }
        }
    } catch (error) {
        console.error("Error editing store:", error);
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

    try {
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
    } catch (error) {
        console.error("Error saving store:", error);
    }
}

// Delete an existing store
async function deleteStore(storeName) {
    const confirmDelete = confirm(`Are you sure you want to delete ${storeName}?`);

    if (confirmDelete) {
        try {
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
        } catch (error) {
            console.error("Error deleting store:", error);
        }
    }
}

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

// Admin menu
async function getAdminMenu() {
    try {
        const response = await fetch(`http://localhost:5000/`, {
            method: "POST",
        });

        if (response.status === 401) {
            hideAdminMenu();
        } else {
            showAdminMenu();
        }
    } catch (error) {
        console.error("Error fetching admin menu:", error);
        hideAdminMenu();
    }
}

function showAdminMenu() {
    const addStoreButton = document.getElementById("add-store-btn");
    const logoutButton = document.getElementById("logout-btn");
    const loginButton = document.getElementById("login-btn");
    const deleteButtons = document.querySelectorAll(".delete-btn")
    const adminHelpText = document.getElementById("adminHelp");

    addStoreButton.style.display = 'block';
    logoutButton.style.display = 'block';
    loginButton.style.display = 'none';
    deleteButtons.forEach(button => {
        button.style.display = 'block';
    });
    adminHelpText.innerText = '*Click on the stores to edit them';

}

function hideAdminMenu() {
    const addStoreButton = document.getElementById("add-store-btn");
    const logoutButton = document.getElementById("logout-btn");
    const loginButton = document.getElementById("login-btn");
    const deleteButtons = document.querySelectorAll(".delete-btn")
    const adminHelpText = document.getElementById("adminHelp");

    addStoreButton.style.display = 'none';
    logoutButton.style.display = 'none';
    loginButton.style.display = 'block';
    deleteButtons.forEach(button => {
        button.style.display = 'none';
    });    adminHelpText.innerText = '';
}

loadStores();