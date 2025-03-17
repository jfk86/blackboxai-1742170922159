// Maximum number of scans to store
const MAX_STORED_SCANS = 10;

// Storage key
const STORAGE_KEY = 'halal_checker_history';
const DARK_MODE_KEY = 'dark_mode_enabled';

// Save scan to local storage
function saveToHistory(ingredients) {
    try {
        const history = getHistory();
        const newScan = {
            timestamp: new Date().toISOString(),
            ingredients: ingredients
        };
        
        history.unshift(newScan);
        
        // Keep only the most recent scans
        if (history.length > MAX_STORED_SCANS) {
            history.pop();
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
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

// Clear scan history
function clearHistory() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing history:', error);
        return false;
    }
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
