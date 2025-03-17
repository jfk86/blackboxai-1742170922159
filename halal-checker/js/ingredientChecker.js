// Database of ingredient classifications
const ingredientDatabase = {
    // Definitely Halal ingredients
    halal: [
        'water', 'salt', 'sugar', 'vegetables', 'fruits', 'grains', 'rice', 'wheat', 'barley',
        'oats', 'corn', 'dates', 'honey', 'milk', 'eggs', 'fish', 'seafood', 'vinegar',
        'yeast', 'spices', 'herbs', 'vegetables', 'cocoa', 'coffee', 'tea'
    ],

    // Definitely Haram ingredients
    haram: [
        'alcohol', 'wine', 'beer', 'pork', 'lard', 'bacon', 'ham', 'gelatin', 'pepsin',
        'carmine', 'cochineal', 'ethanol', 'rum', 'brandy', 'blood'
    ],

    // Questionable/Doubtful ingredients (Mashbooh)
    mashbooh: [
        'glycerin', 'emulsifiers', 'enzymes', 'lecithin', 'mono glycerides', 'diglycerides',
        'shortening', 'whey', 'vanilla extract', 'natural flavors', 'artificial flavors',
        'calcium stearate', 'magnesium stearate', 'stearic acid', 'rennet'
    ]
};

// Common ingredient variations and their standardized forms
const ingredientAliases = {
    'glycerol': 'glycerin',
    'e422': 'glycerin',
    'cochineal extract': 'carmine',
    'e120': 'carmine',
    'monoglycerides': 'mono glycerides',
    'diglycerides': 'diglycerides',
    'vanillin': 'vanilla extract',
    'shellac': 'e904',
    'ethyl alcohol': 'alcohol',
    'sodium stearate': 'stearic acid'
};

// Function to classify ingredients
async function classifyIngredients(ingredients) {
    const results = [];

    for (let ingredient of ingredients) {
        ingredient = standardizeIngredient(ingredient);
        const classification = classifySingleIngredient(ingredient);
        results.push({
            ingredient: ingredient,
            status: classification,
            confidence: calculateConfidence(ingredient, classification)
        });
    }

    // Sort results by confidence
    results.sort((a, b) => b.confidence - a.confidence);

    return results;
}

// Function to standardize ingredient names
function standardizeIngredient(ingredient) {
    ingredient = ingredient.toLowerCase().trim();
    
    // Check for known aliases
    if (ingredientAliases[ingredient]) {
        return ingredientAliases[ingredient];
    }

    // Remove common prefixes/suffixes
    ingredient = ingredient
        .replace(/^(natural|artificial|synthetic|modified|processed)\s+/, '')
        .replace(/\s+(powder|extract|oil|concentrate|derivative)$/, '');

    return ingredient;
}

// Function to classify a single ingredient
function classifySingleIngredient(ingredient) {
    // Check exact matches first
    if (ingredientDatabase.haram.includes(ingredient)) {
        return 'Haram';
    }
    if (ingredientDatabase.halal.includes(ingredient)) {
        return 'Halal';
    }
    if (ingredientDatabase.mashbooh.includes(ingredient)) {
        return 'Mashbooh';
    }

    // Check partial matches
    for (const haramIng of ingredientDatabase.haram) {
        if (ingredient.includes(haramIng)) {
            return 'Haram';
        }
    }

    for (const halalIng of ingredientDatabase.halal) {
        if (ingredient.includes(halalIng)) {
            return 'Halal';
        }
    }

    for (const mashboohIng of ingredientDatabase.mashbooh) {
        if (ingredient.includes(mashboohIng)) {
            return 'Mashbooh';
        }
    }

    // If no match found, mark as Masbooh (doubtful)
    return 'Masbooh';
}

// Function to calculate confidence score
function calculateConfidence(ingredient, classification) {
    let confidence = 0.5; // Base confidence

    // Exact matches have higher confidence
    if (ingredientDatabase[classification.toLowerCase()].includes(ingredient)) {
        confidence = 0.9;
    }

    // Known aliases have high confidence
    if (Object.keys(ingredientAliases).includes(ingredient)) {
        confidence = 0.85;
    }

    // Partial matches have lower confidence
    if (confidence === 0.5) {
        for (const knownIng of ingredientDatabase[classification.toLowerCase()]) {
            if (ingredient.includes(knownIng) || knownIng.includes(ingredient)) {
                confidence = 0.7;
                break;
            }
        }
    }

    // Unknown ingredients (defaulting to Masbooh) have lowest confidence
    if (classification === 'Mashbooh' && confidence === 0.5) {
        confidence = 0.3;
    }

    return confidence;
}

// Function to get detailed explanation for classification
function getIngredientExplanation(ingredient, classification, confidence) {
    let explanation = `${ingredient} is classified as ${classification}`;

    if (confidence >= 0.9) {
        explanation += ' with high confidence based on exact match in our database.';
    } else if (confidence >= 0.7) {
        explanation += ' based on partial match with known ingredients.';
    } else if (confidence >= 0.5) {
        explanation += ' based on similar ingredients in our database.';
    } else {
        explanation += ' due to uncertainty about its source and processing methods.';
    }

    if (classification === 'Mashbooh') {
        explanation += ' We recommend further verification from a qualified authority.';
    }

    return explanation;
}
