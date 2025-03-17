// Initialize Tesseract worker
const worker = Tesseract.createWorker({
    logger: message => {
        if (message.status === 'recognizing text') {
            updateProgress(message.progress);
        }
    }
});

// Progress tracking
function updateProgress(progress) {
    const percentage = Math.round(progress * 100);
    const loadingText = document.querySelector('#loadingState p');
    if (loadingText) {
        loadingText.textContent = `Analyzing ingredients... ${percentage}%`;
    }
}

// Extract ingredients from image
async function extractIngredientsFromImage(imageSource) {
    try {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        
        const result = await worker.recognize(imageSource);
        await worker.terminate();

        // Process the extracted text
        return processExtractedText(result.data.text);
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to extract text from image. Please try again with a clearer image.');
    }
}

// Process the extracted text to identify ingredients
function processExtractedText(text) {
    // Convert text to lowercase for easier processing
    text = text.toLowerCase();

    // Common ingredient list identifiers
    const ingredientMarkers = [
        'ingredients:', 
        'contains:', 
        'ingredients list:', 
        'made with:'
    ];

    // Find the start of ingredients list
    let startIndex = -1;
    for (const marker of ingredientMarkers) {
        const index = text.indexOf(marker);
        if (index !== -1) {
            startIndex = index + marker.length;
            break;
        }
    }

    // If no marker found, assume the entire text is ingredients
    if (startIndex === -1) {
        startIndex = 0;
    }

    // Extract the ingredients portion
    let ingredientsText = text.slice(startIndex);

    // Remove common non-ingredient text
    ingredientsText = ingredientsText.replace(/nutrition facts|serving size|allergen warning/gi, '');

    // Split into individual ingredients
    let ingredients = ingredientsText
        .split(/[,.]/)
        .map(ingredient => ingredient.trim())
        .filter(ingredient => {
            // Remove empty strings and common non-ingredient text
            return ingredient && 
                   !ingredient.match(/^\d/) && // Remove entries that start with numbers
                   ingredient.length > 1;      // Remove single characters
        });

    // Remove duplicates
    ingredients = [...new Set(ingredients)];

    // If no ingredients found, throw error
    if (ingredients.length === 0) {
        throw new Error('No ingredients could be detected. Please try again with a clearer image of the ingredients list.');
    }

    return ingredients;
}

// Helper function to clean ingredient text
function cleanIngredientText(text) {
    return text
        .replace(/\([^)]*\)/g, '') // Remove parentheses and their contents
        .replace(/[^a-zA-Z\s]/g, ' ') // Remove non-alphabetic characters
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
}
