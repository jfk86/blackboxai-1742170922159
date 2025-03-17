// Trending products handling
async function loadTrendingProducts() {
    try {
        const categories = ['halal', 'haram', 'mashbooh'];
        for (const category of categories) {
            const snapshot = await firebase.firestore()
                .collection('trending')
                .where('category', '==', category)
                .orderBy('searchCount', 'desc')
                .limit(5)
                .get();

            const products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            displayTrendingProducts(category, products);
        }
    } catch (error) {
        console.error('Error loading trending products:', error);
    }
}

function displayTrendingProducts(category, products) {
    const container = document.getElementById(`trending${category.charAt(0).toUpperCase() + category.slice(1)}`);
    if (!container) return;

    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-2">
                <p>No trending products</p>
            </div>
        `;
        return;
    }

    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between text-sm py-1';
        item.innerHTML = `
            <span class="truncate flex-1">${product.name}</span>
            <span class="text-gray-500 dark:text-gray-400 ml-2">
                ${product.searchCount} searches
            </span>
        `;
        container.appendChild(item);
    });
}

// Social sharing functions
function shareOnFacebook(productName, results) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out the halal status of ${productName} on Halal Ingredient Checker!`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
}

function shareOnTwitter(productName, results) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`I just checked ${productName} on Halal Ingredient Checker! #HalalFood #HalalChecker`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
}

function shareOnWhatsApp(productName, results) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out the halal status of ${productName} on Halal Ingredient Checker!\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

async function copyShareLink() {
    try {
        await navigator.clipboard.writeText(window.location.href);
        showMessage('Link copied to clipboard!');
    } catch (error) {
        console.error('Error copying link:', error);
        showError('Failed to copy link. Please try again.');
    }
}

// Helper function to show temporary message
function showMessage(message, duration = 3000) {
    const messageElement = document.createElement('div');
    messageElement.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-transform duration-300 translate-y-0';
    messageElement.textContent = message;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
        messageElement.classList.add('translate-y-full');
        setTimeout(() => messageElement.remove(), 300);
    }, duration);
}

// Initialize trending products on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTrendingProducts();
});
