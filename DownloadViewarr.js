const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();



/*==================================== SETTINGS =====================================*/

// RADARR SERVER SETTINGS
const DEFAULT_RADARR_SERVER_IP = '127.0.0.1'					// Radarr server IP/URL
const DEFAULT_RADARR_SERVER_PORT = 7878						// Radarr server port
const DEFAULT_RADARR_API_KEY = '1234abcdxxxxxxxxxxxxxxxxxxxxxxxx'		// Radarr API Key

// SONARR SERVER SETTINGS
const DEFAULT_SONARR_SERVER_IP = '127.0.0.1'					// Sonarr server IP/URL
const DEFAULT_SONARR_SERVER_PORT = 8989						// Sonarr server port
const DEFAULT_SONARR_API_KEY = '1234abcdxxxxxxxxxxxxxxxxxxxxxxxx'		// Sonarr API Key

// DOWNLOAD VIEWARR SETTINGS
const DEFAULT_SERVER_PORT = 8888						// Port to view download status page
const DEFAULT_ENABLE_DRIVE_STATUS = "FALSE"					// True or False - Enable media drive(s) bar graphs.

/*==================================== SETTINGS =====================================*/




// Don't edit below this line

const settings = {
    movies: {
        apiServerIP: process.env.RADARR_SERVER_IP || DEFAULT_RADARR_SERVER_IP,
        apiServerPort: process.env.RADARR_SERVER_PORT || DEFAULT_RADARR_SERVER_PORT,
        apiKey: process.env.RADARR_API_KEY || DEFAULT_RADARR_API_KEY,
    },
    tvshows: {
        apiServerIP: process.env.SONARR_SERVER_IP || DEFAULT_SONARR_SERVER_IP,
        apiServerPort: process.env.SONARR_SERVER_PORT || DEFAULT_SONARR_SERVER_PORT,
        apiKey: process.env.SONARR_API_KEY || DEFAULT_SONARR_API_KEY,
    },
    nodeServerPort: process.env.NODE_SERVER_PORT || DEFAULT_SERVER_PORT,
    enableDriveStatus: (process.env.ENABLE_DRIVE_STATUS || DEFAULT_ENABLE_DRIVE_STATUS).toLowerCase(),
};

// Middleware to enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve static files from the "public" directory
app.use(express.static('public'));

// Function to fetch root folders from Radarr or Sonarr
async function fetchRootFolders(apiBaseUrl, apiKey) {
    try {
        const response = await axios.get(`${apiBaseUrl}/rootfolder`, {
            headers: { 'X-Api-Key': apiKey },
        });
        return response.data.map(folder => folder.path); // Extract folder paths
    } catch (error) {
        console.error('Error fetching root folders:', error.message);
        return [];
    }
}

// Function to fetch disk space information from Radarr or Sonarr APIs
async function fetchDiskSpace(apiBaseUrl, apiKey) {
    try {
        const response = await axios.get(`${apiBaseUrl}/diskspace?apikey=${apiKey}`);
        return response.data; // Return the API response data
    } catch (error) {
        console.error(`Error fetching disk space from API: ${error.message}`);
        return null; // Return null on error
    }
}

app.get('/api/drive-space', async (req, res) => {
    if (!["true", "yes"].includes(settings.enableDriveStatus)) {
        return res.status(403).send('Drive status is disabled.');
    }

    try {
        // Fetch root folders for Movies and TV Shows
        const radarrRootFolders = await fetchRootFolders(
            `http://${settings.movies.apiServerIP}:${settings.movies.apiServerPort}/api/v3`,
            settings.movies.apiKey
        );
        const sonarrRootFolders = await fetchRootFolders(
            `http://${settings.tvshows.apiServerIP}:${settings.tvshows.apiServerPort}/api/v3`,
            settings.tvshows.apiKey
        );

        const allFolders = [...new Set([...radarrRootFolders, ...sonarrRootFolders])];

        // Fetch disk space data from Radarr API first, fallback to Sonarr API if Radarr fails
        let diskSpaces = await fetchDiskSpace(
            `http://${settings.movies.apiServerIP}:${settings.movies.apiServerPort}/api/v3`,
            settings.movies.apiKey
        );

        if (!diskSpaces) {
            diskSpaces = await fetchDiskSpace(
                `http://${settings.tvshows.apiServerIP}:${settings.tvshows.apiServerPort}/api/v3`,
                settings.tvshows.apiKey
            );
        }

        if (!diskSpaces) {
            return res.status(500).send('Failed to fetch disk space data');
        }

        // Filter disk spaces to only include those with a matching root folder
        const filteredDiskSpaces = diskSpaces.filter(disk =>
            allFolders.some(folder => folder.startsWith(disk.path))
        );

        // Deduplicate results based on the root drive (e.g., "F:\\")
        const uniqueDriveSpaces = Object.values(
            filteredDiskSpaces.reduce((acc, drive) => {
                const rootDrive = drive.path.split(':')[0] + ':\\'; // Extract root drive
                if (!acc[rootDrive]) {
                    acc[rootDrive] = { 
                        path: rootDrive, 
                        label: drive.label,
                        freeSpace: drive.freeSpace,
                        totalSpace: drive.totalSpace,
                    };
                } else {
                    // If already exists, sum up the free and total space
                    acc[rootDrive].freeSpace += drive.freeSpace;
                    acc[rootDrive].totalSpace += drive.totalSpace;
                }
                return acc;
            }, {})
        );

        // Format the response
        const formattedDriveSpaces = uniqueDriveSpaces.map(drive => ({
            path: drive.path,
            label: drive.label,
            freeSpace: `${(drive.freeSpace / 1e9).toFixed(2)} GB`,
            totalSpace: `${(drive.totalSpace / 1e9).toFixed(2)} GB`,
            usedSpace: `${((drive.totalSpace - drive.freeSpace) / 1e9).toFixed(2)} GB`,
            percentageUsed: Math.round(((drive.totalSpace - drive.freeSpace) / drive.totalSpace) * 100)
        }));

        res.json(formattedDriveSpaces); // Return the formatted drive space data
    } catch (error) {
        console.error('Error in /api/drive-space:', error.message);
        res.status(500).send('Failed to fetch drive space data');
    }
});

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

// Server-side endpoint to provide the aggregate downloading queue count
app.get('/api/queue/downloading', async (req, res) => {
    try {
        // Fetch downloading data for movies and TV shows
        const [movies, tvshows] = await Promise.all([fetchData('movies'), fetchData('tvshows')]);

        // Filter items with "downloading" status and count them
        const totalMoviesDownloading = movies.filter(item => item.status.toLowerCase() === 'downloading').length;
        const totalTvShowsDownloading = tvshows.filter(item => item.status.toLowerCase() === 'downloading').length;

        // Total count
        const totalDownloading = totalMoviesDownloading + totalTvShowsDownloading;

        res.json({ total: totalDownloading }); // Return total downloading count
    } catch (error) {
        console.error('Error in /api/queue/downloading:', error.message);
        res.status(500).send('Failed to fetch downloading queue data');
    }
});

// Start the server
app.listen(settings.nodeServerPort, () => {
    console.log(`Drive bar graphs enabled: ${settings.enableDriveStatus}`);
    console.log(`Server running at http://localhost:${settings.nodeServerPort}`);
});
