let currentTable = 'movies'; // Default to Movies table
let refreshInterval = null; // To store the interval ID

// Function to switch tables
function switchTable(tableType) {
    currentTable = tableType;

    // Save the current table type to localStorage
    localStorage.setItem('currentTable', currentTable);

    document.getElementById('moviesButton').classList.toggle('active', tableType === 'movies');
    document.getElementById('tvShowsButton').classList.toggle('active', tableType === 'tvshows');

    // Update table headers based on the selected table
    updateTableHeaders();

    // Fetch and populate the new table immediately
    fetchAndPopulateTable();

    // Restart the interval for periodic updates
    startDataRefresh();
}

// Function to update table headers based on the table type
function updateTableHeaders() {
    const tableHeaders = document.getElementById('table-headers');
    if (currentTable === 'movies') {
        tableHeaders.innerHTML = `
            <th onclick="sortTable(0)">Title <span class="sort-icon">&#x2b0d;</span></th>
            <th onclick="sortTable(1)">Year <span class="sort-icon">&#x2b0d;</span></th>
            <th onclick="sortTable(2)">Quality <span class="sort-icon">&#x2b0d;</span></th>
            <th onclick="sortTable(3)">Formats <span class="sort-icon">&#x2b0d;</span></th>
            <th onclick="sortTable(4)">Time Left <span class="sort-icon">&#x2b0d;</span></th>
            <th onclick="sortTable(5)">Status <span class="sort-icon">&#x2b0d;</span></th>
            <th>Progress</th>
        `;
    } else if (currentTable === 'tvshows') {
        tableHeaders.innerHTML = `
            <th onclick="sortTable(0)">Title <span class="sort-icon">&#x2b0d;</span></th>
            <th onclick="sortTable(1)">Quality <span class="sort-icon">&#x2b0d;</span></th>
            <th onclick="sortTable(2)">Formats <span class="sort-icon">&#x2b0d;</span></th>
            <th onclick="sortTable(3)">Time Left <span class="sort-icon">&#x2b0d;</span></th>
            <th onclick="sortTable(4)">Status <span class="sort-icon">&#x2b0d;</span></th>
            <th>Progress</th>
        `;
    }
}

// Function to fetch and populate the table with data
async function fetchAndPopulateTable() {
    try {
        // Determine the endpoint to fetch data from
        const endpoint = currentTable === 'movies' ? '/api/queue/movies' : '/api/queue/tvshows';

        // Fetch data from the server-side endpoint
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
        const data = await response.json();

        // Generate table rows
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = generateTableRows(data);

        // After populating the table, check for progress bar overflows
        checkOverflow();
    } catch (error) {
        console.error('Error fetching and populating table:', error.message);
    }
}

// Function to generate HTML for table rows
function generateTableRows(data) {
    return data.map(item => {
        if (currentTable === 'movies') {
            const movie = item.movie || { title: "-", year: "-" };
            const quality = (item.quality && item.quality.quality && item.quality.quality.name) || "-";
            const customFormats = item.customFormats && item.customFormats.length > 0
                ? item.customFormats.map(format => `<span class="button">${format.name}</span>`).join(' ')
                : "-";
            const timeleft = item.timeleft || "-";
            const status = item.status || "-";
            const errorMessage = item.errorMessage || "No additional details available"; // Tooltip text
            const size = item.size || 0;
            const sizeLeft = item.sizeleft || 0;
            const progressPercent = size ? ((size - sizeLeft) / size) * 100 : 0;

            // Determine status button class based on status type
            const statusClass = status.toLowerCase();

            return `
                <tr>
                    <td>${movie.title}</td>
                    <td class="year">${movie.year}</td>
                    <td><span class="button quality">${quality}</span></td>
                    <td>${customFormats}</td>
                    <td class="timeleft">${timeleft}</td>
                    <td>
                        <span class="status-button ${statusClass}" title="${errorMessage}">
                            ${status}
                        </span>
                    </td>
                    <td>
                        <div class="progress">
                            <div class="progress-bar ${statusClass} ${statusClass === 'downloading' ? 'animated' : ''}" 
                                 style="width: ${progressPercent}%" 
                                 title="${progressPercent.toFixed(2)}%">
                                <span class="text">${progressPercent.toFixed(2)}%</span>
                            </div>
                        </div>
                    </td>
                </tr>`;
        } else if (currentTable === 'tvshows') {
            const title = item.title || "-";
            const quality = (item.quality && item.quality.quality && item.quality.quality.name) || "-";
            const customFormats = item.customFormats && item.customFormats.length > 0
                ? item.customFormats.map(format => `<span class="button">${format.name}</span>`).join(' ')
                : "-";
            const timeleft = item.timeleft || "-";
            const status = item.status || "-";
            const errorMessage = item.errorMessage || "No additional details available"; // Tooltip text
            const size = item.size || 0;
            const sizeLeft = item.sizeleft || 0;
            const progressPercent = size ? ((size - sizeLeft) / size) * 100 : 0;

            // Determine status button class based on status type
            const statusClass = status.toLowerCase();

            return `
                <tr>
                    <td>${title}</td>
                    <td><span class="button quality">${quality}</span></td>
                    <td>${customFormats}</td>
                    <td class="timeleft">${timeleft}</td>
                    <td>
                        <span class="status-button ${statusClass}" title="${errorMessage}">
                            ${status}
                        </span>
                    </td>
                    <td>
                        <div class="progress">
                            <div class="progress-bar ${statusClass} ${statusClass === 'downloading' ? 'animated' : ''}" 
                                 style="width: ${progressPercent}%" 
                                 title="${progressPercent.toFixed(2)}%">
                                <span class="text">${progressPercent.toFixed(2)}%</span>
                            </div>
                        </div>
                    </td>
                </tr>`;
        }
    }).join('');
}

// Function to start refreshing data every 10 seconds
function startDataRefresh() {
    if (refreshInterval) clearInterval(refreshInterval); // Clear any existing interval

    // Start a new interval to refresh data every 10 seconds
    refreshInterval = setInterval(() => {
        fetchAndPopulateTable();
    }, 10000);
}

// Function to check for overflow and hide percentage text if needed
function checkOverflow() {
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(progressBar => {
        const text = progressBar.querySelector('.text');
        const progressWidth = progressBar.clientWidth;
        const textWidth = text.scrollWidth;

        // Hide the text if it overflows the progress bar
        if (textWidth > progressWidth) {
            text.style.visibility = 'hidden';
        } else {
            text.style.visibility = 'visible';
        }
    });
}

// Restore scroll positions on page load
document.addEventListener('DOMContentLoaded', () => {
    // Restore the previous tab from localStorage
    const savedTable = localStorage.getItem('currentTable');
    if (savedTable) {
        currentTable = savedTable;
    }

    // Set the active tab
    document.getElementById('moviesButton').classList.toggle('active', currentTable === 'movies');
    document.getElementById('tvShowsButton').classList.toggle('active', currentTable === 'tvshows');

    // Update table headers and populate the table
    updateTableHeaders();
    fetchAndPopulateTable();

    // Start refreshing data every 10 seconds
    startDataRefresh();
});