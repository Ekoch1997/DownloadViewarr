let currentTable = 'movies'; // Default to Movies table
let refreshInterval = null; // To store the interval ID
let loaderTimeout = null; // To store the timeout ID for loader animation

// Function to stop the loader animation
function stopLoaderAnimation() {
    const loader = document.getElementById('loadingIcon');
    if (loader) {
        loader.classList.add('stopped'); // Add the 'stopped' class to stop animation
    }
}

// Function to reset the loader animation
function resetLoaderAnimation() {
    const loader = document.getElementById('loadingIcon');
    if (loader) {
        loader.classList.remove('stopped'); // Remove the 'stopped' class to restart animation
    }
}

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

        // Get the current sorting state
        const columnIndex = parseInt(localStorage.getItem('sortColumnIndex'), 10) || 0; // Default to first column
        const isAscending = localStorage.getItem('sortOrder') === 'asc';

        // Sort the data before rendering
        data.sort((itemA, itemB) => {
            const valueA = getColumnValue(itemA, columnIndex);
            const valueB = getColumnValue(itemB, columnIndex);

            const compareResult = isNaN(valueA) || isNaN(valueB)
                ? valueA.localeCompare(valueB, undefined, { numeric: true })
                : parseFloat(valueA) - parseFloat(valueB);

            return isAscending ? compareResult : -compareResult;
        });

        // Generate table rows
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = generateTableRows(data);

        // After populating the table, check for progress bar overflows
        checkOverflow();

        // Reset the loader animation on successful data fetch
        resetLoaderAnimation();

        // Clear and restart the loader timeout
        if (loaderTimeout) clearTimeout(loaderTimeout);
        loaderTimeout = setTimeout(() => {
            stopLoaderAnimation();
        }, 12000); // Stop loader animation after 12 seconds if no refresh occurs
    } catch (error) {
        console.error('Error fetching and populating table:', error.message);
        // Stop the loader animation in case of an error
        stopLoaderAnimation();
    }
}

// Helper function to extract column values for sorting
function getColumnValue(item, columnIndex) {
    if (currentTable === 'movies') {
        switch (columnIndex) {
            case 0: return item.movie?.title || '';
            case 1: return item.movie?.year || '';
            case 2: return item.quality?.quality?.name || '';
            case 3: return item.customFormats?.map(format => format.name).join(', ') || '';
            case 4: return item.timeleft || '';
            case 5: return item.status || '';
            default: return '';
        }
    } else if (currentTable === 'tvshows') {
        switch (columnIndex) {
            case 0: return item.title || '';
            case 1: return item.quality?.quality?.name || '';
            case 2: return item.customFormats?.map(format => format.name).join(', ') || '';
            case 3: return item.timeleft || '';
            case 4: return item.status || '';
            default: return '';
        }
    }
    return '';
}

// Function to sort the table when a header is clicked
function sortTable(columnIndex) {
    // Toggle the sort order
    const isAscending = localStorage.getItem('sortOrder') !== 'asc';
    localStorage.setItem('sortOrder', isAscending ? 'asc' : 'desc');
    localStorage.setItem('sortColumnIndex', columnIndex);

    // Fetch and refresh the table with the sorted data
    fetchAndPopulateTable();
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
    if (loaderTimeout) clearTimeout(loaderTimeout); // Clear any existing timeout

    // Start a new interval to refresh data every 10 seconds
    refreshInterval = setInterval(() => {
        fetchAndPopulateTable();

        // Clear and restart the loader timeout
        if (loaderTimeout) clearTimeout(loaderTimeout);
        loaderTimeout = setTimeout(() => {
            stopLoaderAnimation();
        }, 12000); // Stop loader animation after 12 seconds if no refresh occurs
    }, 10000); // 10 seconds
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

// Function to monitor URL parameters and call switchTable once
function monitorUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table');
    if (tableParam === 'movies') {
        switchTable('movies');
    } else if (tableParam === 'tvshows') {
        switchTable('tvshows');
    }
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

    // Monitor URL parameters for table switching
    monitorUrlParameters();
});
