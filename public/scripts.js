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

// Function to monitor the URL parameters and set the correct tab
function monitorTabFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam === 'movies' || tableParam === 'tvshows') {
        switchTable(tableParam); // Correctly handle table=movies or table=tvshows
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
            <th onclick="sortTable(0)">Title</th>
            <th onclick="sortTable(1)">Year</th>
            <th onclick="sortTable(2)">Quality</th>
            <th onclick="sortTable(3)">Formats</th>
            <th onclick="sortTable(4)">Time Left</th>
            <th onclick="sortTable(5)">Status</th>
            <th onclick="sortTable(6)">Progress</th>
        `;
    } else if (currentTable === 'tvshows') {
        tableHeaders.innerHTML = `
            <th onclick="sortTable(0)">Title</th>
            <th onclick="sortTable(1)">Quality</th>
            <th onclick="sortTable(2)">Formats</th>
            <th onclick="sortTable(3)">Time Left</th>
            <th onclick="sortTable(4)">Status</th>
            <th onclick="sortTable(5)">Progress</th>
        `;
    }
}

// Function to fetch data for both tables and update bubbles
async function fetchBubbleCounts() {
    try {
        // Fetch data for Movies
        const moviesResponse = await fetch('/api/queue/movies');
        if (!moviesResponse.ok) throw new Error(`Failed to fetch movies data: ${moviesResponse.statusText}`);
        const moviesData = await moviesResponse.json();
        const moviesDownloadingCount = moviesData.filter(item => item.status.toLowerCase() === 'downloading').length;

        // Update the Movies bubble
        const moviesCountBubble = document.getElementById('moviesCount');
        if (moviesDownloadingCount > 0) {
            moviesCountBubble.textContent = moviesDownloadingCount;
            moviesCountBubble.style.display = 'block';
        } else {
            moviesCountBubble.style.display = 'none';
        }

        // Fetch data for TV Shows
        const tvShowsResponse = await fetch('/api/queue/tvshows');
        if (!tvShowsResponse.ok) throw new Error(`Failed to fetch TV shows data: ${tvShowsResponse.statusText}`);
        const tvShowsData = await tvShowsResponse.json();
        const tvShowsDownloadingCount = tvShowsData.filter(item => item.status.toLowerCase() === 'downloading').length;

        // Update the TV Shows bubble
        const tvShowsCountBubble = document.getElementById('tvShowsCount');
        if (tvShowsDownloadingCount > 0) {
            tvShowsCountBubble.textContent = tvShowsDownloadingCount;
            tvShowsCountBubble.style.display = 'block';
        } else {
            tvShowsCountBubble.style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching bubble counts:', error.message);
    }
}

// Function to fetch and populate the table with data
async function fetchAndPopulateTable() {
    try {
        const endpoint = currentTable === 'movies' ? '/api/queue/movies' : '/api/queue/tvshows';
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
        const data = await response.json();

        // Count rows with a "downloading" status
        const downloadingCount = data.filter(item => item.status.toLowerCase() === 'downloading').length;

        // Update the count bubble for the appropriate tab
        if (currentTable === 'movies') {
            const moviesCountBubble = document.getElementById('moviesCount');
            if (downloadingCount > 0) {
                moviesCountBubble.textContent = downloadingCount;
                moviesCountBubble.style.display = 'block';
            } else {
                moviesCountBubble.style.display = 'none';
            }
        } else if (currentTable === 'tvshows') {
            const tvShowsCountBubble = document.getElementById('tvShowsCount');
            if (downloadingCount > 0) {
                tvShowsCountBubble.textContent = downloadingCount;
                tvShowsCountBubble.style.display = 'block';
            } else {
                tvShowsCountBubble.style.display = 'none';
            }
        }

        // Get the current sorting state
        const columnIndex = parseInt(localStorage.getItem('sortColumnIndex'), 10); // Default to no sorting
        const isAscending = localStorage.getItem('sortOrder') === 'asc';

        // Sort the data before rendering if sorting is defined
        if (!isNaN(columnIndex)) {
            data.sort((itemA, itemB) => {
                const valueA = getColumnValue(itemA, columnIndex);
                const valueB = getColumnValue(itemB, columnIndex);

                const compareResult = isNaN(valueA) || isNaN(valueB)
                    ? valueA.localeCompare(valueB, undefined, { numeric: true })
                    : parseFloat(valueA) - parseFloat(valueB);

                return isAscending ? compareResult : -compareResult;
            });
        }

        // Generate table rows
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = generateTableRows(data);

        // Update header icons based on sorting state
        updateHeaderIcons(columnIndex, isAscending);

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
        stopLoaderAnimation();
    }

    // Update the count bubbles for both tabs
    await fetchBubbleCounts();
}

// Helper function to extract column values for sorting
function getColumnValue(item, columnIndex) {
    if (currentTable === 'movies') {
        switch (columnIndex) {
            case 0: 
                return (item.movie?.title || '').toLowerCase(); // Title column
            case 1: 
                return item.movie?.year || ''; // Year column
            case 2: 
                return item.quality?.quality?.name || ''; // Quality column
            case 3: 
                return item.customFormats?.map(format => format.name).join(', ') || ''; // Formats column
            case 4: 
                return item.timeleft || ''; // Time Left column
            case 5: 
                return item.status || ''; // Status column
            case 6: 
                return calculateProgressPercentage(item); // Progress column
            default: 
                return '';
        }
    } else if (currentTable === 'tvshows') {
        switch (columnIndex) {
            case 0: 
                return (item.title || '').toLowerCase(); // Title column
            case 1: 
                return item.quality?.quality?.name || ''; // Quality column
            case 2: 
                return item.customFormats?.map(format => format.name).join(', ') || ''; // Formats column
            case 3: 
                return item.timeleft || ''; // Time Left column
            case 4: 
                return item.status || ''; // Status column
            case 5: 
                return calculateProgressPercentage(item); // Progress column
            default: 
                return '';
        }
    }
    return '';
}

// Helper function to calculate progress percentage
function calculateProgressPercentage(item) {
    const size = item.size || 0;
    const sizeLeft = item.sizeleft || 0;
    return size ? ((size - sizeLeft) / size) * 100 : 0; // Return progress as a percentage
}

// Function to sort the table when a header is clicked
function sortTable(columnIndex) {
    const isAscending = localStorage.getItem('sortOrder') !== 'asc';
    localStorage.setItem('sortOrder', isAscending ? 'asc' : 'desc');
    localStorage.setItem('sortColumnIndex', columnIndex);

    fetchAndPopulateTable();
}

// Function to update header icons based on sort state
function updateHeaderIcons(columnIndex, isAscending) {
    const headers = document.querySelectorAll('#table-headers th');

    headers.forEach((header, index) => {
        // Clear all icons first
        header.textContent = header.textContent.replace(/[\u2191\u2193]/g, '').trim();

        // Add the appropriate arrow for the sorted column
        if (index === columnIndex) {
            header.textContent += isAscending ? ' ↑' : ' ↓'; // Add ↑ for ascending, ↓ for descending
        }
    });
}

// Function to generate HTML for table rows
function generateTableRows(data) {
    return data.map(item => {
        if (currentTable === 'movies') {
            const movie = item.movie || { title: "-", year: "-" };
            const quality = (item.quality && item.quality.quality && item.quality.quality.name) || "-";

            // Handle custom formats properly
            const customFormats = Array.isArray(item.customFormats) && item.customFormats.length > 0
                ? item.customFormats.map(format => {
                    const escapedName = format.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    return `<span class="button format-item" title="Format: ${escapedName}">${escapedName}</span>`;
                }).join(' ')
                : '<span class="no-formats">None</span>'; // Display "None" if no formats exist

            const timeleft = item.timeleft || "-";
            const status = item.status || "-";
            const errorMessage = item.errorMessage || "No additional details available"; // Tooltip text
            const progressPercent = calculateProgressPercentage(item);

            return `
                <tr>
                    <td>${movie.title}</td>
                    <td class="year">${movie.year}</td>
                    <td><span class="button quality">${quality}</span></td>
                    <td>${customFormats}</td>
                    <td class="timeleft">${timeleft}</td>
                    <td>
                        <span class="status-button ${status.toLowerCase()}" title="${errorMessage}">
                            ${status}
                        </span>
                    </td>
                    <td>
                        <div class="progress">
                            <div class="progress-bar ${status.toLowerCase()}" 
                                 style="width: ${progressPercent}%">
                                <span class="text">${progressPercent.toFixed(2)}%</span>
                            </div>
                        </div>
                    </td>
                </tr>`;
        } else if (currentTable === 'tvshows') {
            const title = item.title || "-";
            const quality = (item.quality && item.quality.quality && item.quality.quality.name) || "-";

            // Handle custom formats properly
            const customFormats = Array.isArray(item.customFormats) && item.customFormats.length > 0
                ? item.customFormats.map(format => {
                    const escapedName = format.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    return `<span class="button format-item" title="Format: ${escapedName}">${escapedName}</span>`;
                }).join(' ')
                : '<span class="no-formats">None</span>'; // Display "None" if no formats exist

            const timeleft = item.timeleft || "-";
            const status = item.status || "-";
            const progressPercent = calculateProgressPercentage(item);

            return `
                <tr>
                    <td>${title}</td>
                    <td><span class="button quality">${quality}</span></td>
                    <td>${customFormats}</td>
                    <td class="timeleft">${timeleft}</td>
                    <td>
                        <span class="status-button ${status.toLowerCase()}" title="${status}">
                            ${status}
                        </span>
                    </td>
                    <td>
                        <div class="progress">
                            <div class="progress-bar ${status.toLowerCase()}" 
                                 style="width: ${progressPercent}%">
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
    if (refreshInterval) clearInterval(refreshInterval);
    if (loaderTimeout) clearTimeout(loaderTimeout);

    refreshInterval = setInterval(() => {
        fetchAndPopulateTable();
        if (loaderTimeout) clearTimeout(loaderTimeout);
        loaderTimeout = setTimeout(() => stopLoaderAnimation(), 12000);
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

// Restore settings on page load
document.addEventListener('DOMContentLoaded', () => {
    monitorTabFromUrl(); // Handle URL parameter on page load

    const savedTable = localStorage.getItem('currentTable');
    if (!new URLSearchParams(window.location.search).get('table') && savedTable) {
        switchTable(savedTable); // Restore table from localStorage if no URL param
    }

    updateTableHeaders();
    fetchAndPopulateTable();
    startDataRefresh();
});
