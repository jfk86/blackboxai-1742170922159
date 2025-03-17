// Firebase configuration
const firebaseConfig = {
    // Replace with your Firebase config
    apiKey: "YOUR_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Auth state observer
auth.onAuthStateChanged((user) => {
    const userNotLoggedIn = document.getElementById('userNotLoggedIn');
    const userLoggedIn = document.getElementById('userLoggedIn');
    const shareSection = document.getElementById('shareSection');

    if (user) {
        // User is signed in
        userNotLoggedIn.classList.add('hidden');
        userLoggedIn.classList.remove('hidden');
        shareSection.classList.remove('hidden');

        // Update user info
        document.getElementById('userAvatar').src = user.photoURL;
        document.getElementById('userName').textContent = user.displayName;

        // Load user's saved searches
        loadUserSearches(user.uid);
    } else {
        // User is signed out
        userNotLoggedIn.classList.remove('hidden');
        userLoggedIn.classList.add('hidden');
        shareSection.classList.add('hidden');
    }
});

// Sign in with Google
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error('Error signing in:', error);
        showError('Failed to sign in. Please try again.');
    }
}

// Sign out
async function signOut() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Error signing out:', error);
        showError('Failed to sign out. Please try again.');
    }
}

// Save search to user's history
async function saveSearch(searchData) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await db.collection('users').doc(user.uid).collection('searches').add({
            ...searchData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update trending products
        await updateTrendingProducts(searchData);
    } catch (error) {
        console.error('Error saving search:', error);
    }
}

// Load user's saved searches
async function loadUserSearches(userId) {
    try {
        const snapshot = await db.collection('users').doc(userId)
            .collection('searches')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        const searches = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        displayUserSearches(searches);
    } catch (error) {
        console.error('Error loading searches:', error);
    }
}

// Update trending products
async function updateTrendingProducts(searchData) {
    try {
        const productRef = db.collection('trending').doc(searchData.productId);
        await productRef.set({
            name: searchData.productName,
            category: searchData.category,
            searchCount: firebase.firestore.FieldValue.increment(1),
            lastSearched: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating trending products:', error);
    }
}

// Load trending products
async function loadTrendingProducts() {
    try {
        const categories = ['halal', 'haram', 'mashbooh'];
        for (const category of categories) {
            const snapshot = await db.collection('trending')
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

// Display trending products
function displayTrendingProducts(category, products) {
    const container = document.getElementById(`trending${category.charAt(0).toUpperCase() + category.slice(1)}`);
    container.innerHTML = '';

    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between text-sm';
        item.innerHTML = `
            <span class="truncate">${product.name}</span>
            <span class="text-gray-500">${product.searchCount}</span>
        `;
        container.appendChild(item);
    });
}

// Social sharing functions
function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Check out these ingredient analysis results from Halal Ingredient Checker!');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
}

function shareOnWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Check out these ingredient analysis results from Halal Ingredient Checker!');
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
}

function copyShareLink() {
    navigator.clipboard.writeText(window.location.href)
        .then(() => {
            showMessage('Link copied to clipboard!');
        })
        .catch(err => {
            console.error('Error copying link:', err);
            showError('Failed to copy link. Please try again.');
        });
}

// Initialize trending products on load
document.addEventListener('DOMContentLoaded', () => {
    loadTrendingProducts();
});
