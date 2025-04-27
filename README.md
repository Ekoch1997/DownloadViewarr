
[![image](https://github.com/user-attachments/assets/a25dba92-84d6-431d-abad-eb0777141d2d)](#)
[![Github Visits](https://img.shields.io/endpoint?url=https://github-counter.vercel.app/api/visits&query=$.message?)](#) [![Docker Pulls](https://img.shields.io/docker/pulls/pir8radio/downloadviewarr?)](https://hub.docker.com/r/pir8radio/downloadviewarr) [![Github Clones](https://img.shields.io/endpoint?url=https://github-counter.vercel.app/api/clones&query=$.message?)](#)


# DownloadViewarr

DownloadViewarr is a Node.js application designed to fetch and display download queues for [Radarr](https://radarr.video/) and [Sonarr](https://sonarr.tv/). It provides a simple and user-friendly interface to view movies and TV show download queues via a web page.

## Docker Image
[![image](https://github.com/user-attachments/assets/2f17bae4-5dc6-4b7d-83b3-da6b7422a536)](https://hub.docker.com/r/pir8radio/downloadviewarr)

```html
docker pull pir8radio/downloadviewarr
```


## Features

- Fetches download queue data from Radarr and Sonarr using their APIs.
- Displays data in an organized format on a web page.
- Easy to configure and run locally.
- Can be used by itself, or embeded as an iframe within ombi or some other request app.
- Embed an easy floating button into Ombi, add the below line just above ```</body>``` in the ```ClientApp/dist/index.html``` file.
  * the color="#e5a00d" part is optional, you can make the floating button match your theme, leave the color part off and it will default to plex theme colors. Can also be embedded into other webpages.
  * Enter the IP address or URL and port number you ended up using for the Download Viewarr install, Yes you need to enter it twice. The first one is to grab the JS file, the second one tells the script where to get the API data from.
  ```html
  <script src="http://<downloadviewarr url or IP>/downloadviewarr_button.js" downloadviewarr-url="http://<downloadviewarr url or IP>" color="#e5a00d"></script>
  ```
  
## Screenshots 
** Simulated images, of course...

- Browser Tab (new download indicator)<br>
![browsertab](https://github.com/user-attachments/assets/11570056-afaf-46dc-8edd-f1f28a1da556)

  
- Standalone Webpage
![Timeline+1+(555551)](https://github.com/user-attachments/assets/67ea9882-7e24-44ce-8576-8799a5b2b2d5)


- Embeded as a modal popup in Ombi (little cloud icon in the bottom left to bring it up)
  This method requires some HTML/Javascript code to be added to whatever page you want, like Ombi (in this example)
![image](https://github.com/user-attachments/assets/fd89ce5b-8564-4aaa-b446-f84ec6bb9812)


- Mobile Device - Embeded in Ombi
[![mobile](https://github.com/user-attachments/assets/89209dba-2153-4540-9409-813e6226a81b)](https://github.com/user-attachments/assets/89209dba-2153-4540-9409-813e6226a81b)

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

3. Configure the settings in the `DownloadViewarr.js` file or an env file:

```javascript
/*==================================== SETTINGS =====================================*/
const settings = {
    movies: {
        apiServerIP: process.env.RADARR_SERVER_IP || '127.0.0.1',                    // Radarr server IP (Docker: from env var, Native: default to localhost)
        apiServerPort: process.env.RADARR_SERVER_PORT || 7878,                       // Radarr server port
        apiKey: process.env.RADARR_API_KEY || '1234abcdxxxxxxxxxxxxxxxxxxxxxxxx',    // Radarr API Key
    },
    tvshows: {
        apiServerIP: process.env.SONARR_SERVER_IP || '127.0.0.1',                    // Sonarr server IP (Docker: from env var, Native: default to localhost)
        apiServerPort: process.env.SONARR_SERVER_PORT || 8989,                       // Sonarr server port
        apiKey: process.env.SONARR_API_KEY || '1234abcdxxxxxxxxxxxxxxxxxxxxxxxx',    // Sonarr API Key
    },
    nodeServerPort: process.env.NODE_SERVER_PORT || 8888,                            // Port to view download page
};
/*==================================== SETTINGS =====================================*/
```

4. Start the application:

   ```bash
   npm start
   ```

5. Open your browser and navigate to:

   ```
   http://localhost:8888
   ```
   You can also link directly to either the Movies table or the TV Shows table by adding the table parameter on the url like so:
   ```
   http://localhost:8888/?table=tvshows
   ```

## Dependencies

- [Express](https://expressjs.com/): Web framework for Node.js.
- [Axios](https://axios-http.com/): Promise-based HTTP client for Node.js.

## API Endpoints

The application includes the following API endpoints:

- **Movies Queue**: `/api/queue/movies`
- **TV Shows Queue**: `/api/queue/tvshows`
- **Total Active Downloads**: `/api/queue/downloading`

These endpoints fetch data from the Radarr and Sonarr APIs and return it in JSON format.

## File Structure

- `package.json`: Contains project metadata and dependencies.
- `DownloadViewarr.js`: Main application file.
- `public/`: Directory for static assets (e.g., HTML, CSS, JavaScript files).

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

## Author

Developed by [pir8radio](https://github.com/pir8radio).






# Update History
## 04-26-2025
- This should be the last flash update, lol sorry guys, been pushing out features!
- added tab download indicator to the floating button embed
- added download indicator to the actual floating button (updates every 30 seconds) so you can see if something started downloading without opening the modal.
- made the Movies and TV Shows tabs look more like tabs instead of weird buttons above the table. 
- cleaned up some code.

## 04-18-2025
- Fixed loading bar animiation (that i accidently broke)
- added tab "bubbles" to show how many active downloads are on each tab "Movies" & "TV Shows"
- Cleaned up header sort "arrows" hide them on all but sorted column.
- Can now sort by download progress too.
- Created single line of javascript you can add to any existing page, to pop up a window showing the Download Viewarr. 

## 04-14-2025
- Create Docker Image for project
- Automate Docker Build
- Added support for direct links to "Movies" and "TV Shows" tabs.
- Improved "LIVE" animation, goes offline and online automatically and picks up where it left off.
- Added some "memory", after a page refresh/reload the Download Viewarr will go back to the last tab you were on, unless you linked to the tab or its your first visit.

## 04-12-2025
- Public Release
