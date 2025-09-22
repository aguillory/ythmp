
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
    Timestamp,
    updateDoc,
    deleteDoc
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
        // isArchived: REMOVED
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
    
    // Query: Find maps matching the signature, ordered by sortOrder ascending
    // REMOVED: where("isArchived", "==", false)
    const q = query(
        mapsRef, 
        where("chestSignature", "==", chestSignature),
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

/**
 * NEW: Fetches a single map by its document ID.
 */
export async function fetchMapById(mapId) {
    if (!auth.currentUser) {
        throw new Error("User not authenticated.");
    }
    
    if (!mapId || mapId.length < 4) {
        throw new Error("Invalid Map ID.");
    }

    try {
        const docRef = doc(db, MAPS_COLLECTION, mapId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                data: docSnap.data()
            };
        } else {
            // No document found
            return null;
        }
    } catch (error) {
        console.error("Error fetching map by ID:", error);
        throw error;
    }
}


/**
 * Updates an existing map in the database
 */
export async function updateMapInDatabase(mapId, mapData, notesHtml) {
    if (!auth.currentUser) {
        throw new Error("User not authenticated.");
    }

    try {
        const docRef = doc(db, MAPS_COLLECTION, mapId);
        
        // Get the current document to preserve existing fields
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            throw new Error("Map not found");
        }
        
        const currentData = docSnap.data();
        
        // Update only the fields that should change
        const updateData = {
            mapData: mapData,
            notesHtml: notesHtml,
            updatedAt: Timestamp.now()
        };
        
        // Update chest counts if they changed
        const countSm = mapData.sm || 0;
        const countMd = mapData.md || 0;
        const countLg = mapData.lg || 0;
        const countXl = mapData.xl || 0;
        const newChestSignature = `${countSm}.${countMd}.${countLg}.${countXl}`;
        
        if (newChestSignature !== currentData.chestSignature) {
            // If chest signature changed, we need to update sort order
            const newSortOrder = await getNextSortOrder(newChestSignature);
            updateData.countSm = countSm;
            updateData.countMd = countMd;
            updateData.countLg = countLg;
            updateData.countXl = countXl;
            updateData.chestSignature = newChestSignature;
            updateData.sortOrder = newSortOrder;
        }
        
        await updateDoc(docRef, updateData);
        console.log("Map updated successfully:", mapId);
        return mapId;
    } catch (error) {
        console.error("Error updating map:", error);
        throw error;
    }
}

/**
 * Deletes a map from the database
 */
export async function deleteMapFromDatabase(mapId) {
    if (!auth.currentUser) {
        throw new Error("User not authenticated.");
    }

    try {
        const docRef = doc(db, MAPS_COLLECTION, mapId);
        await deleteDoc(docRef);
        console.log("Map deleted successfully:", mapId);
        return true;
    } catch (error) {
        console.error("Error deleting map:", error);
        throw error;
    }
}

/**
 * Reorders a map up or down within its chest signature group
 */
export async function reorderMap(mapId, direction) {
    if (!auth.currentUser) {
        throw new Error("User not authenticated.");
    }

    try {
        const docRef = doc(db, MAPS_COLLECTION, mapId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error("Map not found");
        }
        
        const currentData = docSnap.data();
        const currentSortOrder = currentData.sortOrder;
        const chestSignature = currentData.chestSignature;
        
        // Find the map to swap with
        const mapsRef = collection(db, MAPS_COLLECTION);
        let swapQuery;
        
        if (direction === 'up') {
            // Find the map with the highest sortOrder that's less than current
            swapQuery = query(
                mapsRef,
                where("chestSignature", "==", chestSignature),
                where("sortOrder", "<", currentSortOrder),
                orderBy("sortOrder", "desc"),
                limit(1)
            );
        } else {
            // Find the map with the lowest sortOrder that's greater than current
            swapQuery = query(
                mapsRef,
                where("chestSignature", "==", chestSignature),
                where("sortOrder", ">", currentSortOrder),
                orderBy("sortOrder", "asc"),
                limit(1)
            );
        }
        
        const swapSnapshot = await getDocs(swapQuery);
        
        if (swapSnapshot.empty) {
            // No map to swap with (already at top/bottom)
            return;
        }
        
        const swapDoc = swapSnapshot.docs[0];
        const swapData = swapDoc.data();
        const swapSortOrder = swapData.sortOrder;
        
        // Perform the swap
        await updateDoc(docRef, { sortOrder: swapSortOrder });
        await updateDoc(swapDoc.ref, { sortOrder: currentSortOrder });
        
        console.log(`Map ${mapId} moved ${direction}`);
        
    } catch (error) {
        console.error("Error reordering map:", error);
        throw error;
    }
}


/**
 * NEW: Fetches ALL maps from Firestore, sorted by signature and then sortOrder.
 * Exported for use in the "All Maps" tab.
 */
export async function fetchAllMaps() {
    if (!auth.currentUser) {
        throw new Error("User not authenticated.");
    }

    const mapsRef = collection(db, MAPS_COLLECTION);
    
    // Query: Find all maps, ordered by signature, then by sortOrder
    // REMOVED: where("isArchived", "==", false)
    const q = query(
        mapsRef, 
        orderBy("chestSignature", "asc"),
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
        console.error("Error fetching all maps:", error);
        throw error;
    }
}