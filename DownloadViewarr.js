const express = require('express');
const axios = require('axios');
const app = express();

/*==================================== SETTINGS =====================================*/
const settings = {
    movies: {
        apiServerIP: '127.0.0.1', 			// Radarr server IP
        apiServerPort: 7878,        			// Radarr server port
        apiKey: '1234abcdxxxxxxxxxxxxxxxxxxxxxxxx', 	// Radarr API Key
    },
    tvshows: {
        apiServerIP: '127.0.0.1', 			// Sonarr server IP
        apiServerPort: 8989,        			// Sonarr server port
        apiKey: '1234abcdxxxxxxxxxxxxxxxxxxxxxxxx', 	// Sonarr API Key
    },
    nodeServerPort: 8888 				// Port to view download page
};
/*==================================== SETTINGS =====================================*/


// Serve static files from the "public" directory
app.use(express.static('public'));

// Function to fetch data from the external API
async function fetchData(type) {
    try {
        const config = settings[type]; // Get the settings for the specified type (movies or tvshows)
        const apiUrl = `http://${config.apiServerIP}:${config.apiServerPort}/api/v3/queue/details?include${type === 'movies' ? 'Movie' : 'Tv'}=true&apikey=${config.apiKey}`;
        const response = await axios.get(apiUrl);
        return response.data; // Return the API response data
    } catch (error) {
        console.error(`Error fetching ${type} data from API:`, error.message);
        return []; // Return an empty array to handle gracefully
    }
}

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); // Serve the index.html file
});

// Server-side endpoint to provide data for Movies
app.get('/api/queue/movies', async (req, res) => {
    try {
        const data = await fetchData('movies'); // Fetch data for Movies
        res.json(data); // Send the data as JSON to the client
    } catch (error) {
        console.error('Error in /api/queue/movies:', error.message);
        res.status(500).send('Failed to fetch Movies data');
    }
});

// Server-side endpoint to provide data for TV Shows
app.get('/api/queue/tvshows', async (req, res) => {
    try {
        const data = await fetchData('tvshows'); // Fetch data for TV Shows
        res.json(data); // Send the data as JSON to the client
    } catch (error) {
        console.error('Error in /api/queue/tvshows:', error.message);
        res.status(500).send('Failed to fetch TV Shows data');
    }
});

// Start the server
app.listen(settings.nodeServerPort, () => {
    console.log(`Server running at http://localhost:${settings.nodeServerPort}`);
});