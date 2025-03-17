// DOM Elements
const cameraTab = document.getElementById('cameraTab');
const uploadTab = document.getElementById('uploadTab');
const urlTab = document.getElementById('urlTab');
const cameraInput = document.getElementById('cameraInput');
const urlInput = document.getElementById('urlInput');
const imagePreview = document.getElementById('imagePreview');
const cameraCapture = document.getElementById('cameraCapture');
const preview = document.getElementById('preview');
const retakeButton = document.getElementById('retakeButton');
const analyzeButton = document.getElementById('analyzeButton');
const loadingState = document.getElementById('loadingState');
const resultsSection = document.getElementById('resultsSection');
const ingredientsList = document.getElementById('ingredientsList');
const errorMessage = document.getElementById('errorMessage');
const uploadArea = document.querySelector('.upload-area');

// Initialize the upload area
function initializeUploadArea() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    uploadArea.classList.add('drag-over');
    uploadArea.querySelector('.fa-camera').classList.add('text-green-500');
    uploadArea.querySelector('p').classList.add('text-green-600');
}

function unhighlight(e) {
    uploadArea.classList.remove('drag-over');
    uploadArea.querySelector('.fa-camera').classList.remove('text-green-500');
    uploadArea.querySelector('p').classList.remove('text-green-600');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                showImagePreview();
                resetResults();
            };
            reader.readAsDataURL(file);
        } else {
            showError('Please upload an image file');
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeUploadArea();
    initDarkMode();
    displayRecentScans();
    
    // Initialize tabs
    cameraTab.addEventListener('click', () => switchTab('camera'));
    uploadTab.addEventListener('click', () => switchTab('upload'));
    urlTab.addEventListener('click', () => switchTab('url'));
    
    // Initialize other event listeners
    cameraCapture.addEventListener('change', handleImageCapture);
    retakeButton.addEventListener('click', resetCapture);
    analyzeButton.addEventListener('click', analyzeImage);
    darkModeToggle.addEventListener('click', () => {
        toggleDarkMode();
        updateDarkModeUI();
    });

    // Set initial tab state
    switchTab('camera');
});

// Tab Switching
function switchTab(tab) {
    const allTabs = [
        { button: cameraTab, section: cameraInput, icon: 'fa-camera' },
        { button: uploadTab, section: cameraInput, icon: 'fa-upload' },
        { button: urlTab, section: urlInput, icon: 'fa-link' }
    ];

    // Hide all sections and deactivate all tabs
    allTabs.forEach(t => {
        t.button.classList.remove('tab-active');
        t.button.classList.add('tab-inactive');
        t.section.classList.add('hidden');
    });

    // Activate selected tab and show its section
    const currentTab = allTabs.find(t => t.button.id.startsWith(tab));
    if (currentTab) {
        currentTab.button.classList.remove('tab-inactive');
        currentTab.button.classList.add('tab-active');
        currentTab.section.classList.remove('hidden');
    }

    // Handle specific tab behaviors
    if (tab === 'camera') {
        cameraCapture.setAttribute('capture', 'environment');
        uploadArea.querySelector('p').textContent = 'Tap to take a photo of the ingredients';
        cameraInput.classList.remove('hidden');
        urlInput.classList.add('hidden');
    } else if (tab === 'upload') {
        cameraCapture.removeAttribute('capture');
        uploadArea.querySelector('p').textContent = 'Click to upload or drag and drop an image';
        cameraInput.classList.remove('hidden');
        urlInput.classList.add('hidden');
    } else if (tab === 'url') {
        cameraInput.classList.add('hidden');
        urlInput.classList.remove('hidden');
    }

    // Reset form
    resetCapture();
}

// Handle Image Capture
function handleImageCapture(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                showImagePreview();
                resetResults();
            };
            reader.readAsDataURL(file);
        } else {
            showError('Please select an image file');
            resetCapture();
        }
    }
}

// Show Image Preview
function showImagePreview() {
    cameraInput.classList.add('hidden');
    imagePreview.classList.remove('hidden');
    // Add animation
    preview.style.opacity = '0';
    setTimeout(() => {
        preview.style.opacity = '1';
        preview.style.transition = 'opacity 0.3s ease-in-out';
    }, 50);
}

// Reset Capture
function resetCapture() {
    cameraCapture.value = '';
    imagePreview.classList.add('hidden');
    if (!urlInput.classList.contains('hidden')) {
        document.getElementById('productUrl').value = '';
    }
    resetResults();
}

// Reset Results
function resetResults() {
    resultsSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
    ingredientsList.innerHTML = '';
}

// Analyze Image
async function analyzeImage() {
    try {
        showLoading(true);
        let ingredients;

        if (!urlInput.classList.contains('hidden')) {
            // URL mode
            const url = document.getElementById('productUrl').value;
            if (!url) {
                throw new Error('Please enter a product URL');
            }
            
            // Update loading state for URL analysis
            updateLoadingText('Fetching product information...');
            
            try {
                ingredients = await fetchIngredientsFromUrl(url);
                updateLoadingText('Analyzing ingredients...');
            } catch (urlError) {
                throw new Error(`Failed to analyze URL: ${urlError.message}`);
            }
        } else if (!preview.src) {
            throw new Error('Please capture or upload an image first');
        } else {
            // Image mode
            ingredients = await extractIngredientsFromImage(preview.src);
        }

        // Show what ingredients were found
        updateLoadingText(`Found ${ingredients.length} ingredients. Analyzing...`);
        
        const results = await classifyIngredients(ingredients);
        displayResults(results);
        
        // Save to history
        saveToHistory(results);
        displayRecentScans();
    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Update loading text
function updateLoadingText(text) {
    const loadingText = document.querySelector('#loadingState p');
    if (loadingText) {
        loadingText.textContent = text;
    }
}

// Show URL loading state
function showUrlLoading(show, message = '') {
    const urlInput = document.getElementById('urlInput');
    const urlLoadingState = document.getElementById('urlLoadingState');
    const urlLoadingText = document.getElementById('urlLoadingText');
    const urlLoadingSteps = document.getElementById('urlLoadingSteps');

    if (show) {
        urlInput.classList.add('hidden');
        urlLoadingState.classList.remove('hidden');
        if (message) {
            urlLoadingText.textContent = message;
        }
    } else {
        urlInput.classList.remove('hidden');
        urlLoadingState.classList.add('hidden');
    }
}

// Update URL loading steps
function updateUrlLoadingSteps(step) {
    const urlLoadingSteps = document.getElementById('urlLoadingSteps');
    const stepElement = document.createElement('div');
    stepElement.className = 'flex items-center justify-center space-x-2 mb-2';
    stepElement.innerHTML = `
        <i class="fas fa-circle-notch animate-spin text-green-500"></i>
        <span>${step}</span>
    `;
    urlLoadingSteps.appendChild(stepElement);
}

// Function to fetch ingredients from URL
async function fetchIngredientsFromUrl(url) {
    try {
        showUrlLoading(true, 'Initializing URL analysis...');
        updateUrlLoadingSteps('Validating URL format');
        
        if (!url.startsWith('http')) {
            throw new Error('Please enter a valid URL starting with http:// or https://');
        }

        // Function to try different fetch methods
        async function tryFetch(fetchUrl, isProxy = false) {
            const response = await fetch(fetchUrl, {
                mode: 'cors',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                }
            });
            
            if (!response.ok) {
                throw new Error(isProxy ? 'Proxy fetch failed' : 'Direct fetch failed');
            }

            const contentType = response.headers.get('content-type') || '';
            updateUrlLoadingSteps(`Detected content type: ${contentType.split(';')[0]}`);
            
            // Handle JSON response
            if (contentType.includes('application/json')) {
                const jsonData = await response.json();
                updateUrlLoadingSteps('Processing JSON data');
                return extractIngredientsFromJson(jsonData);
            }
            
            // Handle HTML/text response
            updateUrlLoadingSteps('Processing HTML content');
            const text = await response.text();
            return extractIngredientsFromText(text);
        }

        // First try direct fetch
        try {
            updateUrlLoadingSteps('Attempting direct access to URL');
            return await tryFetch(url);
        } catch (directError) {
            console.log('Direct fetch failed, trying proxy...', directError);
            
            // If direct fetch fails, try using a CORS proxy
            updateUrlLoadingSteps('Using proxy service for better compatibility');
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            return await tryFetch(proxyUrl, true);
        }
    } catch (error) {
        console.error('URL fetch error:', error);
        throw new Error('Failed to extract ingredients. Please ensure the URL points to a valid product page or try uploading an image instead.');
    } finally {
        showUrlLoading(false);
    }
}

// Function to extract ingredients from JSON response
function extractIngredientsFromJson(jsonData) {
    try {
        // Handle Open Food Facts API format
        if (jsonData.product && jsonData.product.ingredients_text) {
            return jsonData.product.ingredients_text
                .split(',')
                .map(i => i.trim())
                .filter(i => i.length > 0);
        }

        if (jsonData.product && Array.isArray(jsonData.product.ingredients)) {
            return jsonData.product.ingredients
                .map(ing => ing.text || ing.id || ing)
                .filter(ing => ing && typeof ing === 'string');
        }

        // Try different common JSON structures
        const possiblePaths = [
            data => data.ingredients,
            data => data.product?.ingredients_text,
            data => data.productInfo?.ingredients,
            data => data.label?.ingredients,
            data => data.nutrition?.ingredients,
            // Open Food Facts specific paths
            data => data.product?.ingredients_text_en,
            data => data.product?.ingredients_text_with_allergens
        ];

        for (const path of possiblePaths) {
            try {
                const ingredients = path(jsonData);
                if (ingredients) {
                    if (Array.isArray(ingredients)) {
                        return ingredients
                            .map(ing => typeof ing === 'string' ? ing : ing.name || ing.text || ing.ingredient || ing.value)
                            .filter(ing => ing && typeof ing === 'string');
                    } else if (typeof ingredients === 'string') {
                        return ingredients
                            .split(/,|\|/)
                            .map(i => i.trim())
                            .filter(i => i.length > 0 && !i.match(/^\d+$/));
                    }
                }
            } catch (e) {
                continue;
            }
        }

        // If no ingredients found in standard paths, try to find any text containing "ingredients"
        for (const key in jsonData) {
            if (typeof jsonData[key] === 'string' && 
                key.toLowerCase().includes('ingredient')) {
                return jsonData[key]
                    .split(/,|\|/)
                    .map(i => i.trim())
                    .filter(i => i.length > 0);
            }
        }

        throw new Error('Could not find ingredients in the API response. Please try a different URL or upload an image.');
    } catch (error) {
        console.error('JSON parsing error:', error);
        throw new Error('Failed to parse ingredients from the API response. Please try a different URL or upload an image.');
    }
}

// Helper function to extract ingredients from HTML text
function extractIngredientsFromText(text) {
    // Common patterns for ingredient lists
    const patterns = [
        /Ingredients?:?\s*([^<\n]+)/i,
        /Contains?:?\s*([^<\n]+)/i,
        /Made with:?\s*([^<\n]+)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const ingredients = match[1]
                .split(/,|\|/)
                .map(i => i.trim())
                .filter(i => i.length > 0 && !i.match(/^\d+$/));

            if (ingredients.length > 0) {
                return ingredients;
            }
        }
    }

    throw new Error('Could not find ingredients on the product page. Please ensure the URL points to a product page with visible ingredients.');
}

// Function to update dark mode UI elements
function updateDarkModeUI() {
    const isDark = isDarkMode();
    document.documentElement.classList.toggle('dark', isDark);
}

// Function to display recent scans
function displayRecentScans() {
    const scansList = document.getElementById('scansList');
    const history = getHistory();
    
    if (history.length === 0) {
        scansList.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                <i class="fas fa-history text-2xl mb-2"></i>
                <p>No recent scans</p>
            </div>
        `;
        return;
    }

    scansList.innerHTML = history.map((scan, index) => {
        const date = new Date(scan.timestamp).toLocaleDateString();
        const time = new Date(scan.timestamp).toLocaleTimeString();
        
        return `
            <div class="bg-gray-50 dark:bg-dark-bg rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-600 dark:text-gray-400">${date} ${time}</span>
                </div>
                <div class="space-y-2">
                    ${scan.ingredients.map(ing => `
                        <div class="flex items-center justify-between">
                            <span class="text-gray-800 dark:text-gray-200">${ing.ingredient}</span>
                            <span class="px-2 py-1 rounded text-sm ${getStatusClass(ing.status)}">
                                ${ing.status}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Helper function to get status-based classes
function getStatusClass(status) {
    const classes = {
        'Halal': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
        'Haram': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        'Mashbooh': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
    };
    return classes[status] || '';
}

// Display Functions
function showLoading(show) {
    loadingState.classList.toggle('hidden', !show);
    analyzeButton.disabled = show;
    analyzeButton.classList.toggle('opacity-50', show);
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    
    // Add shake animation
    errorMessage.classList.add('animate-shake');
    setTimeout(() => {
        errorMessage.classList.remove('animate-shake');
    }, 500);
}

function displayResults(results) {
    resultsSection.classList.remove('hidden');
    ingredientsList.innerHTML = '';

    results.forEach((result, index) => {
        const item = document.createElement('div');
        const statusColors = {
            'Halal': 'green',
            'Haram': 'red',
            'Mashbooh': 'yellow'
        };
        const statusColor = statusColors[result.status];
        
        item.className = `flex items-center justify-between p-4 bg-${statusColor}-50 rounded-lg mb-3 hover:bg-${statusColor}-100 transition-all duration-200 opacity-0`;
        item.innerHTML = `
            <div class="flex-1">
                <span class="font-medium text-gray-800">${result.ingredient}</span>
                <div class="text-sm text-gray-600 mt-1">Confidence: ${Math.round(result.confidence * 100)}%</div>
            </div>
            <span class="px-3 py-1 rounded-full bg-${statusColor}-100 text-${statusColor}-800 text-sm font-medium ml-4">
                ${result.status}
            </span>
        `;

        ingredientsList.appendChild(item);

        // Animate items appearing one by one
        setTimeout(() => {
            item.style.transition = 'opacity 0.3s ease-in-out';
            item.style.opacity = '1';
        }, index * 100);
    });

    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
