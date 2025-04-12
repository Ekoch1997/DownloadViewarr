
![image](https://github.com/user-attachments/assets/a25dba92-84d6-431d-abad-eb0777141d2d)


# DownloadViewarr

DownloadViewarr is a Node.js application designed to fetch and display download queues for [Radarr](https://radarr.video/) and [Sonarr](https://sonarr.tv/). It provides a simple and user-friendly interface to view movies and TV show download queues via a web page.

## Features

- Fetches download queue data from Radarr and Sonarr using their APIs.
- Displays data in an organized format on a web page.
- Easy to configure and run locally.
- Can be used by itself, or embeded as an iframe within ombi or some other request app.

## Screenshots
- Standalone Webpage
![image](https://github.com/user-attachments/assets/3484f6f5-9673-483d-83c0-1c15293b161b)

- Embeded as a modal popup in Ombi (little cloud icon in the bottom left to bring it up)
  This method requires some HTML/Javascript code to be added to the Ombi web UI on your end
![image](https://github.com/user-attachments/assets/2a66fa2e-2c1a-45e0-968c-f8caf4be99c4)

- Mobile Device - Embeded in Ombi
![mobile](https://github.com/user-attachments/assets/89209dba-2153-4540-9409-813e6226a81b)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/pir8radio/DownloadViewarr.git
   cd DownloadViewarr
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure the settings in the `DownloadViewarr.js` file:

   ```javascript
   const settings = {
       movies: {
           apiServerIP: '127.0.0.1', // Radarr server IP
           apiServerPort: 7878,      // Radarr server port
           apiKey: 'your_radarr_api_key', // Radarr API Key
       },
       tvshows: {
           apiServerIP: '127.0.0.1', // Sonarr server IP
           apiServerPort: 8989,      // Sonarr server port
           apiKey: 'your_sonarr_api_key', // Sonarr API Key
       },
       nodeServerPort: 8888 // Port to view download page
   };
   ```

4. Start the application:

   ```bash
   npm start
   ```

5. Open your browser and navigate to:

   ```
   http://localhost:8888
   ```

## Dependencies

- [Express](https://expressjs.com/): Web framework for Node.js.
- [Axios](https://axios-http.com/): Promise-based HTTP client for Node.js.

## API Endpoints

The application includes the following API endpoints:

- **Movies Queue**: `/api/queue/movies`
- **TV Shows Queue**: `/api/queue/tvshows`

These endpoints fetch data from the Radarr and Sonarr APIs and return it in JSON format.

## File Structure

- `package.json`: Contains project metadata and dependencies.
- `DownloadViewarr.js`: Main application file.
- `public/`: Directory for static assets (e.g., HTML, CSS, JavaScript files).

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

## Author

Developed by [pir8radio](https://github.com/pir8radio).
