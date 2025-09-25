// js/database_public.js

// Import the functions you need from the SDKs (Using the version specified in the builder)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    orderBy,
} from "https://www.gstatic.com/firebasejs/12.2.0/firebase-firestore.js";


// Your web app's Firebase configuration (copied from the provided database.js)
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
const db = getFirestore(app);

const MAPS_COLLECTION = "maps";

/**
 * Fetches maps from Firestore based on the chest signature (Public Access).
 */
export async function fetchMapsBySignaturePublic(chestSignature) {
    // No authentication check required due to Firestore rules.

    const mapsRef = collection(db, MAPS_COLLECTION);

    // Query: Find maps matching the signature, ordered by sortOrder ascending
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