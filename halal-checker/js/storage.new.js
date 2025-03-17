// Maximum number of scans to store
const MAX_STORED_SCANS = 10;

// Storage keys
const STORAGE_KEY = 'halal_checker_history';
const DARK_MODE_KEY = 'dark_mode_enabled';

// Helper functions
function generateProductId(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function getCategoryFromResults(results) {
    if (results.haram && results.haram.length > 0) return 'haram';
    if (results.mashbooh && results.mashbooh.length > 0) return 'mashbooh';
    return 'halal';
}

function formatResults(results) {
    const parts = [];
    if (results.halal && results.halal.length > 0) {
        parts.push(`${results.halal.length} Halal`);
    }
    if (results.haram && results.haram.length > 0) {
        parts.push(`${results.haram.length} Haram`);
    }
    if (results.mashbooh && results.mashbooh.length > 0) {
        parts.push(`${results.mashbooh.length} Mashbooh`);
    }
    return parts.join(' • ');
}

// Save scan to storage (both local and Firebase if logged in)
async function saveToHistory(results) {
    const scan = {
        timestamp: new Date().toISOString(),
        results: results,
        productName: results.productName || 'Unknown Product',
        category: getCategoryFromResults(results)
    };

    try {
        // Save to local storage
        const history = getHistory();
        history.unshift(scan);
        
        // Keep only the most recent scans
        if (history.length > MAX_STORED_SCANS) {
            history.pop();
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

        // If user is logged in, save to Firebase
        const user = firebase.auth().currentUser;
        if (user) {
            await saveSearch({
                ...scan,
                userId: user.uid,
                productId: generateProductId(scan.productName)
            });
        }

        // Update UI
        displayRecentScans();
        return true;
    } catch (error) {
        console.error('Error saving to history:', error);
        return false;
    }
}

// Get scan history from local storage
function getHistory() {
    try {
        const history = localStorage.getItem(STORAGE_KEY);
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('Error getting history:', error);
        return [];
    }
}

// Display recent scans
function displayRecentScans() {
    const scansList = document.getElementById('scansList');
    const history = getHistory();

    scansList.innerHTML = '';

    if (history.length === 0) {
        scansList.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                <i class="fas fa-history text-2xl mb-2"></i>
                <p>No recent scans</p>
            </div>
        `;
        return;
    }

    history.forEach(scan => {
        const scanElement = document.createElement('div');
        scanElement.className = 'bg-gray-50 dark:bg-dark-bg rounded-lg p-4';
        
        const categoryColor = {
            halal: 'text-green-600 dark:text-green-400',
            haram: 'text-red-600 dark:text-red-400',
            mashbooh: 'text-yellow-600 dark:text-yellow-400'
        }[scan.category];

        scanElement.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium ${categoryColor}">${scan.productName}</h3>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                    ${new Date(scan.timestamp).toLocaleDateString()}
                </span>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300">
                ${formatResults(scan.results)}
            </div>
            <div class="mt-2 flex justify-end space-x-2">
                <button onclick="shareResult('${scan.productName}')" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        `;
        scansList.appendChild(scanElement);
    });
}

// Share result
function shareResult(productName) {
    const shareSection = document.getElementById('shareSection');
    shareSection.classList.remove('hidden');
    // Scroll to share section
    shareSection.scrollIntoView({ behavior: 'smooth' });
}

// Dark mode functions
function isDarkMode() {
    return localStorage.getItem(DARK_MODE_KEY) === 'true';
}

function setDarkMode(enabled) {
    localStorage.setItem(DARK_MODE_KEY, enabled);
    document.documentElement.classList.toggle('dark', enabled);
}

function toggleDarkMode() {
    const isDark = !isDarkMode();
    setDarkMode(isDark);
    return isDark;
}

// Initialize dark mode from stored preference
function initDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedPreference = localStorage.getItem(DARK_MODE_KEY);
    
    if (storedPreference !== null) {
        setDarkMode(storedPreference === 'true');
    } else {
        setDarkMode(prefersDark);
    }
}

// Initialize display on load
document.addEventListener('DOMContentLoaded', () => {
    displayRecentScans();
    initDarkMode();
});
