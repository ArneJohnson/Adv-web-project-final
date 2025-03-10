document.getElementById('store-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('store-name').value;
    const district = document.getElementById('store-location').value;

    // Prepare the data to be sent to the server
    const storeData = {
        name: name,
        district: district
    };

    try {
        const response = await fetch('/api/stores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(storeData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Store added successfully!');
            // Redirect back to the index.html page
            window.location.href = '/index.html';
        } else {
            alert(`Error: ${result.message}`);
        }

    } catch (error) {
        alert('Failed to add store. Please try again.');
        console.error('Error:', error);
    }
});