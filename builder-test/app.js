// app.js

// Import the functions you need from the SDKs you need (Using version 12.2.0 as provided)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    setPersistence,
    browserLocalPersistence // Used for "remember me"
} from "https://www.gstatic.com/firebasejs/12.2.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.2.0/firebase-firestore.js";


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCWQORy1kfAfOm3t2-aq8OherNEXk9m70c",
    authDomain: "ythmp-8da2a.firebaseapp.com",
    projectId: "ythmp-8da2a",
    storageBucket: "ythmp-8da2a.firebasestorage.app",
    messagingSenderId: "439367966051",
    appId: "1:439367966051:web:10f9b056563aaac66b0756",
    measurementId: "G-YVHV020HSQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configuration
const ADMIN_EMAIL = "admin@ythmp.maps";
const MAPS_COLLECTION = "maps"; 

// --- Authentication Handlers ---

// Set persistence to LOCAL (Remember the user indefinitely until logout)
setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.error("Error setting persistence:", error);
    });


// Login Handler
async function handleLogin() {
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');
    const password = passwordInput.value;

    if (!password) {
        loginError.textContent = "Password cannot be empty.";
        return;
    }

    loginError.textContent = "Logging in...";

    try {
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
        // Success is handled by the onAuthStateChanged listener
        loginError.textContent = ""; 
    } catch (error) {
        console.error("Login failed:", error);
        loginError.textContent = "Login failed. Please check the password.";
        passwordInput.value = "";
    }
}

// Logout Handler
async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
        alert("Logout failed. Please try again.");
    }
}

// Auth State Listener (The central routing logic)
// This runs after script.js has defined the initialization function.
onAuthStateChanged(auth, (user) => {
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    
    if (user) {
        // User is signed in
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        // Initialize the main application logic (defined globally in script.js)
        if (window.initializeBoardBuilder) {
            window.initializeBoardBuilder();
        }
    } else {
        // User is signed out
        // Ensure authContainer is visible and centered when logged out
        authContainer.style.display = 'flex'; 
        appContainer.style.display = 'none';
    }
});

// Setup Auth Event Listeners
// We use DOMContentLoaded here to ensure the login/logout buttons exist in the DOM.
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const passwordInput = document.getElementById('passwordInput');

    if (loginButton) loginButton.addEventListener('click', handleLogin);
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);

    // Allow pressing Enter to login
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
});


// --- Database Functions (Exported for use in script.js) ---

/**
 * Generates a random 4-character alphanumeric ID.
 */
function generateShortId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generates a unique 4-character ID by checking the database for collisions.
 */
async function generateUniqueMapId() {
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (attempts < MAX_ATTEMPTS) {
        const id = generateShortId();

        // Check if a document with this ID already exists
        const docRef = doc(db, MAPS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // The ID is unique
            return id;
        }

        console.warn(`ID collision detected (${id}). Retrying...`);
        attempts++;
    }

    throw new Error("Failed to generate a unique short ID after several attempts. Please try saving again.");
}

/**
 * Determines the next sort order for a specific chest signature.
 */
async function getNextSortOrder(chestSignature) {
    const mapsRef = collection(db, MAPS_COLLECTION);
    
    // Query: Find maps with the same signature, order by sortOrder descending, limit to 1
    const q = query(
        mapsRef, 
        where("chestSignature", "==", chestSignature),
        orderBy("sortOrder", "desc"),
        limit(1)
    );

    try {
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            // Found an existing map with this signature
            const highestSortMap = querySnapshot.docs[0].data();
            // Use increments of 100 for easy insertion later.
            return highestSortMap.sortOrder + 100;
        } else {
            // This is the first map for this signature
            return 100; 
        }
    } catch (error) {
        console.error("Error getting next sort order:", error);
        return 999999; // Fallback
    }
}


/**
 * Saves the map data to Firestore.
 * Exported so script.js can import it.
 * UPDATED: Removed 'title' parameter.
 */
export async function saveMapToDatabase(mapData, notesHtml) {
    if (!auth.currentUser) {
        throw new Error("User not authenticated.");
    }

    // 1. Prepare Metadata
    const countSm = mapData.sm || 0;
    const countMd = mapData.md || 0;
    const countLg = mapData.lg || 0;
    const countXl = mapData.xl || 0;
    const chestSignature = `${countSm}.${countMd}.${countLg}.${countXl}`;

    // 2. Determine Sort Order and Generate Unique ID (Async operations)
    // We run these concurrently for efficiency
    const [sortOrder, mapId] = await Promise.all([
        getNextSortOrder(chestSignature),
        generateUniqueMapId()
    ]);

    // Map title removed.

    // 3. Construct the Document (Revised Data Model v2)
    const documentData = {
        // title: REMOVED
        sortOrder: sortOrder,
        countSm: countSm,
        countMd: countMd,
        countLg: countLg,
        countXl: countXl,
        chestSignature: chestSignature,
        notesHtml: notesHtml,
        isArchived: false,
        mapData: mapData, // Embed the original JSON
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };

    // 4. Save to Firestore
    try {
        // Use setDoc with the unique mapId as the document ID
        const docRef = doc(db, MAPS_COLLECTION, mapId);
        await setDoc(docRef, documentData);
        console.log("Map saved successfully with ID:", mapId);
        return mapId;
    } catch (error) {
        console.error("Error saving map to database:", error);
        throw error;
    }
}

/**
 * NEW: Fetches maps from Firestore based on the chest signature.
 * Exported for use in the Edit/View Maps tab (script.js).
 */
export async function fetchMapsBySignature(chestSignature) {
    if (!auth.currentUser) {
        throw new Error("User not authenticated.");
    }

    const mapsRef = collection(db, MAPS_COLLECTION);
    
    // Query: Find maps matching the signature, not archived, ordered by sortOrder ascending
    const q = query(
        mapsRef, 
        where("chestSignature", "==", chestSignature),
        where("isArchived", "==", false),
        orderBy("sortOrder", "asc")
    );

    try {
        const querySnapshot = await getDocs(q);
        const maps = [];
        querySnapshot.forEach((doc) => {
            maps.push({
                id: doc.id,
                data: doc.data()
            });
        });
        return maps;
    } catch (error) {
        console.error("Error fetching maps by signature:", error);
        throw error;
    }
}