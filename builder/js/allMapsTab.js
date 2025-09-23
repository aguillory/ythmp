
import { state } from './state.js';
import { fetchAllMaps } from './database.js';
import { createMapCard } from './searchTab.js';

let isLoading = false; // Use this to prevent double-clicks

// Initialize listeners for the new tab
export function initializeAllMapsTab() {
    const columnSelector = document.getElementById('allMapsColumnSelector');
    const loadButton = document.getElementById('loadAllMapsButton'); // Get the new button
    
    if (loadButton) {
        // Load maps when the new button is clicked
        loadButton.addEventListener('click', loadAllMaps);
    }

    if (columnSelector) {
        // Handle column changes
        columnSelector.addEventListener('change', () => {
            const container = document.getElementById('allMapsListContainer');
            if (container) {
                container.setAttribute('data-columns', columnSelector.value);
            }
        });
    }
}

// Fetch and render all maps from the database
async function loadAllMaps() {
    if (isLoading) return; // Prevent multiple loads
    isLoading = true;

    if (!state.elements.allMapsListContainer) {
        console.error("All Maps container not found in state.");
        isLoading = false;
        return;
    }

    state.elements.allMapsListContainer.innerHTML = '<p>Loading all maps...</p>';

    try {
        const maps = await fetchAllMaps();

        if (maps.length === 0) {
            state.elements.allMapsListContainer.innerHTML = '<p>No maps found in the database.</p>';
        } else {
            state.elements.allMapsListContainer.innerHTML = '';
            const fragment = document.createDocumentFragment();
            
            maps.forEach(map => {
                // Call createMapCard with the new option to HIDE re-order buttons
                const mapCard = createMapCard(map.id, map.data, { showReorder: false });
                fragment.appendChild(mapCard);
            });
            
            state.elements.allMapsListContainer.appendChild(fragment);
        }

    } catch (error) {
        console.error("Error loading all maps:", error);
        state.elements.allMapsListContainer.innerHTML = `<p style="color: red;">Error loading maps: ${error.message}</p>`;
    }
    
    isLoading = false;
}