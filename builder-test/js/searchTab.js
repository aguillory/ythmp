import { state } from './state.js';
import { CONFIG } from './config.js';
import { convertFlatTo2D, rotateBoardState, generateBoardCodeObject } from './dataProcessing.js';
import { displayBoard } from './boardDisplay.js';
import { loadBoardFromData } from './eventHandlers.js';
import { checkMapForDuplicates } from './duplicateCheck.js'; // IMPORTED
import { showStatus } from './utils.js'; // IMPORTED

// Add these state variables at the top
let currentEditingMapId = null;
let currentEditingMapData = null;

export function initializeSearchInterface() {
    const populateDropdown = (selectElement, config) => {
        if (!selectElement) return;
        // Add a blank option first
        const blankOption = document.createElement('option');
        blankOption.value = "";
        blankOption.textContent = "-";
        selectElement.appendChild(blankOption);
        
        for (let i = config.min; i <= config.max; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            selectElement.appendChild(option);
        }
        selectElement.value = ""; // Default to blank
    };

    populateDropdown(document.getElementById('searchSmallChests'), CONFIG.CHEST_COUNTS.small);
    populateDropdown(document.getElementById('searchMediumChests'), CONFIG.CHEST_COUNTS.medium);
    populateDropdown(document.getElementById('searchLargeChests'), CONFIG.CHEST_COUNTS.large);
    populateDropdown(document.getElementById('searchExtraLargeChests'), CONFIG.CHEST_COUNTS.extraLarge);

    handleColumnChange();
}

export function setupSearchListeners() {
    if (state.elements.searchChestForm) {
        state.elements.searchChestForm.addEventListener('submit', handleShowMaps);
    }
    
    // NEW: Add listener for ID search
    if (state.elements.idSearchForm) {
        state.elements.idSearchForm.addEventListener('submit', handleSearchById);
    }
    
    const clearSearchBtn = document.getElementById('clearSearchButton');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', handleClearSearch);
    }
    
    const columnSelector = document.getElementById('columnSelector');
    if (columnSelector) {
        columnSelector.addEventListener('change', handleColumnChange);
    }
}

// Export these functions so eventHandlers.js can use them
export function getCurrentEditingMapId() {
    return currentEditingMapId;
}

export function setCurrentEditingMap(mapId, mapData) {
    currentEditingMapId = mapId;
    currentEditingMapData = mapData;
    
    // Update the save button to show update option
    updateSaveButton();
}

export function clearCurrentEditingMap() {
    currentEditingMapId = null;
    currentEditingMapData = null;
    updateSaveButton();
}

function updateSaveButton() {
    const saveBtn = document.getElementById('saveToDbButton');
    const saveControls = document.getElementById('saveControls');
    
    if (!saveBtn || !saveControls) return;
    
    if (currentEditingMapId) {
        // Create update and save as new buttons if they don't exist
        let updateBtn = document.getElementById('updateMapButton');
        let saveAsNewBtn = document.getElementById('saveAsNewButton');
        
        if (!updateBtn) {
            updateBtn = document.createElement('button');
            updateBtn.id = 'updateMapButton';
            updateBtn.type = 'button';
            updateBtn.textContent = 'Update Existing Map';
            updateBtn.addEventListener('click', handleUpdateMap);
            
            saveAsNewBtn = document.createElement('button');
            saveAsNewBtn.id = 'saveAsNewButton';
            saveAsNewBtn.type = 'button';
            saveAsNewBtn.textContent = 'Save as New Map';
            saveAsNewBtn.addEventListener('click', handleSaveAsNew);
            
            // Replace the original save button
            saveBtn.style.display = 'none';
            saveBtn.parentNode.insertBefore(updateBtn, saveBtn);
            saveBtn.parentNode.insertBefore(saveAsNewBtn, saveBtn);
        }
        
        updateBtn.style.display = 'inline-block';
        updateBtn.disabled = false; // Re-enable on load
        saveAsNewBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
    } else {
        // Show original save button, hide update buttons
        const updateBtn = document.getElementById('updateMapButton');
        const saveAsNewBtn = document.getElementById('saveAsNewButton');
        
        if (updateBtn) updateBtn.style.display = 'none';
        if (saveAsNewBtn) saveAsNewBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
    }
}

async function handleUpdateMap() {
    if (!currentEditingMapId) return;
    
    const updateBtn = document.getElementById('updateMapButton');
    if (updateBtn) updateBtn.disabled = true;
    
    showStatus('Updating map...', 'info');

    try {
        const mapData = generateBoardCodeObject();
        
        // --- DUPLICATE CHECK ---
        showStatus("Checking for duplicates...", 'info');
        const duplicate = await checkMapForDuplicates(mapData, currentEditingMapId); // Exclude self
        if (duplicate.isDuplicate) {
            throw new Error(`This map is a duplicate of map ID: ${duplicate.mapId}`);
        }
        // --- END DUPLICATE CHECK ---
        
        showStatus('Saving update to database...', 'info');
        
        let notesHtml = "";
        if (state.quillEditor && state.quillEditor.getLength() > 1) {
            notesHtml = state.quillEditor.root.innerHTML;
        }

        const firebaseModule = await import('./database.js');
        await firebaseModule.updateMapInDatabase(currentEditingMapId, mapData, notesHtml);
        
        showStatus(`Map ${currentEditingMapId} updated successfully!`, 'success');
        
        // Refresh the current view if we're still in the same search
        const currentSignature = getCurrentSearchSignature();
        if (currentSignature) {
            refreshMapSearch(currentSignature);
        }
        
    } catch (error) {
        console.error('Error updating map:', error);
        showStatus(`Error updating map: ${error.message}`, 'error');
        if (updateBtn) updateBtn.disabled = false;
    }
}

async function handleSaveAsNew() {
    // Use the existing save functionality
    const { handleSaveToDatabase } = await import('./eventHandlers.js');
    handleSaveToDatabase();
}

function getCurrentSearchSignature() {
    const sm = document.getElementById('searchSmallChests')?.value || '';
    const md = document.getElementById('searchMediumChests')?.value || '';
    const lg = document.getElementById('searchLargeChests')?.value || '';
    const xl = document.getElementById('searchExtraLargeChests')?.value || '';
    
    if (sm || md || lg || xl) {
        return `${sm}.${md}.${lg}.${xl}`;
    }
    return null;
}

async function refreshMapSearch(signature) {
    try {
        const firebaseModule = await import('./database.js');
        const maps = await firebaseModule.fetchMapsBySignature(signature);
        renderMapList(maps);
    } catch (error) {
        console.error('Error refreshing search:', error);
    }
}

async function handleShowMaps(event) {
    event.preventDefault();
    
    if (!state.elements.mapListContainer) return;

    const sm = document.getElementById('searchSmallChests').value;
    const md = document.getElementById('searchMediumChests').value;
    const lg = document.getElementById('searchLargeChests').value;
    const xl = document.getElementById('searchExtraLargeChests').value;

    // Check if all are empty
    if (!sm && !md && !lg && !xl) {
        state.elements.mapListContainer.innerHTML = '<p>Please select at least one chest count.</p>';
        return;
    }

    const chestSignature = `${sm || 0}.${md || 0}.${lg || 0}.${xl || 0}`;

    state.elements.mapListContainer.innerHTML = '<p>Loading maps...</p>';
    
    // Clear ID search input
    const idInput = document.getElementById('mapIdSearchInput');
    if (idInput) idInput.value = '';

    try {
        const firebaseModule = await import('./database.js');
        
        if (!firebaseModule.fetchMapsBySignature) {
            throw new Error("Database fetch function not available.");
        }

        const maps = await firebaseModule.fetchMapsBySignature(chestSignature);

        if (maps.length === 0) {
            state.elements.mapListContainer.innerHTML = '<p>No maps found for this chest combination.</p>';
        } else {
            renderMapList(maps);
        }

    } catch (error) {
        console.error("Error fetching maps:", error);
        state.elements.mapListContainer.innerHTML = `<p style="color: red;">Error loading maps: ${error.message}</p>`;
    }
}

// NEW: Handler for searching by ID
async function handleSearchById(event) {
    event.preventDefault();
    if (!state.elements.mapListContainer) return;
    
    const input = document.getElementById('mapIdSearchInput');
    const mapId = input ? input.value.trim() : '';
    
    if (!mapId || mapId.length < 4) {
        state.elements.mapListContainer.innerHTML = '<p>Please enter a valid 4-character map ID.</p>';
        return;
    }
    
    state.elements.mapListContainer.innerHTML = `<p>Searching for map ID: ${mapId}...</p>`;
    
    // Clear chest search inputs
    if (state.elements.searchChestForm) {
        state.elements.searchChestForm.reset();
    }

    try {
        const firebaseModule = await import('./database.js');
        const map = await firebaseModule.fetchMapById(mapId);
        
        if (map) {
            renderMapList([map]); // Render as an array with one item
        } else {
            state.elements.mapListContainer.innerHTML = `<p>No map found with ID: ${mapId}</p>`;
        }
        
    } catch (error) {
        console.error("Error fetching map by ID:", error);
        state.elements.mapListContainer.innerHTML = `<p style="color: red;">Error loading map: ${error.message}</p>`;
    }
}


function handleClearSearch() {
    if (state.elements.searchChestForm) {
        state.elements.searchChestForm.reset();
        const colSel = document.getElementById('columnSelector');
        if (colSel) colSel.value = '2';
        handleColumnChange();
    }
    // NEW: Clear ID search
    const idInput = document.getElementById('mapIdSearchInput');
    if (idInput) idInput.value = '';
    
    if (state.elements.mapListContainer) {
        state.elements.mapListContainer.innerHTML = "<p>Select a chest combination and click 'Show Maps' or search by ID.</p>";
    }
}

function handleColumnChange() {
    const columnSelector = document.getElementById('columnSelector');
    if (columnSelector && state.elements.mapListContainer) {
        const columns = columnSelector.value;
        state.elements.mapListContainer.setAttribute('data-columns', columns);
    }
}

function renderMapList(maps) {
    state.elements.mapListContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();

    maps.forEach(map => {
        const mapCard = createMapCard(map.id, map.data, { showReorder: true });
        fragment.appendChild(mapCard);
    });

    state.elements.mapListContainer.appendChild(fragment);
}


async function handleDeleteMap(mapId) {
    if (!confirm(`Are you sure you want to delete map ${mapId}? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const firebaseModule = await import('./database.js');
        await firebaseModule.deleteMapFromDatabase(mapId);
        
        showStatus(`Map ${mapId} deleted successfully!`, 'success');
        
        // Refresh the current view
        const currentSignature = getCurrentSearchSignature();
        if (currentSignature) {
            refreshMapSearch(currentSignature);
        } else {
            // If we weren't in a signature search (e.g., ID search), just clear the results
            handleClearSearch();
        }
    } catch (error) {
        console.error('Error deleting map:', error);
        showStatus(`Error deleting map: ${error.message}`, 'error');
    }
}

async function handleReorderMap(mapId, direction) {
    try {
        const firebaseModule = await import('./database.js');
        await firebaseModule.reorderMap(mapId, direction);
        
        // Refresh the current view
        const currentSignature = getCurrentSearchSignature();
        if (currentSignature) {
            refreshMapSearch(currentSignature);
        }
    } catch (error) {
        console.error('Error reordering map:', error);
        showStatus(`Error reordering map: ${error.message}`, 'error');
    }
}// REPLACE the entire function in searchTab.js with this:

export function createMapCard(mapId, mapData, options = {}) {
    const { showReorder = true } = options; // Correctly get the option

    const card = document.createElement('div');
    card.className = 'map-card';

    const header = document.createElement('div');
    header.className = 'map-card-header';
    header.innerHTML = `<h3>Map ID: ${mapId}</h3>`;
    
    // Action buttons container
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'map-card-actions';
    
    const loadButton = document.createElement('button');
    loadButton.textContent = 'Load into Editor';
    loadButton.className = 'load-map-button';
    loadButton.addEventListener('click', () => {
        const newMapTabLink = document.querySelector('.tablink[data-tab="newMapTab"]');
        if (newMapTabLink) {
            newMapTabLink.click();
        }
        loadBoardFromData(mapData.mapData);
        if (state.quillEditor && mapData.notesHtml) {
            state.quillEditor.root.innerHTML = mapData.notesHtml;
        }
        
        // Set this as the currently editing map
        setCurrentEditingMap(mapId, mapData);
    });
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete-map-button';
    deleteButton.style.backgroundColor = '#ff4444';
    deleteButton.style.color = 'white';
    deleteButton.addEventListener('click', () => handleDeleteMap(mapId));
    
    actionsContainer.appendChild(loadButton);
    actionsContainer.appendChild(deleteButton);

    // This block now correctly adds re-order buttons only if showReorder is true
    if (showReorder) {
        const moveUpButton = document.createElement('button');
        moveUpButton.textContent = '↑';
        moveUpButton.className = 'reorder-button';
        moveUpButton.title = 'Move Up';
        moveUpButton.addEventListener('click', () => handleReorderMap(mapId, 'up'));
        
        const moveDownButton = document.createElement('button');
        moveDownButton.textContent = '↓';
        moveDownButton.className = 'reorder-button';
        moveDownButton.title = 'Move Down';
        moveDownButton.addEventListener('click', () => handleReorderMap(mapId, 'down'));
        
        actionsContainer.appendChild(moveUpButton);
        actionsContainer.appendChild(moveDownButton);
    }
    
    header.appendChild(actionsContainer);
    card.appendChild(header);


    // --- START: ADDED CHEST/COPY HEADER ---
    
    const d = mapData.mapData; // Shortcut for board data
    const copies = d.numberOf || 0;
    const copies2 = d.outOf || 0;
    const smValue = d.sm || 0;
    const mdValue = d.md || 0;
    const lgValue = d.lg || 0;
    const xlValue = d.xl || 0;
    const isAlmostCopy = d.isAlmostCopy || false;
    const selectedCopyIcon = isAlmostCopy ? 'copy2.png' : 'copy.png';

    // Create a container for the header icons
    const chestHeaderClone = document.createElement('div');
    chestHeaderClone.style.display = 'flex';
    chestHeaderClone.style.justifyContent = 'center';
    chestHeaderClone.style.gap = '10px';
    chestHeaderClone.style.flexWrap = 'wrap';
    chestHeaderClone.style.marginBottom = '15px'; // Add some spacing

    // Create "Copy" element
    if (copies > 0 && copies2 > 0 && copies <= copies2) {
        const copyContainer = document.createElement('div');
        copyContainer.className = 'copies-container';
        copyContainer.style.display = 'flex';
        copyContainer.style.alignItems = 'center';
        copyContainer.style.borderRight = '2px solid #000';
        copyContainer.style.paddingRight = '10px';
        
        const copyIcon = document.createElement('img');
        copyIcon.src = selectedCopyIcon;
        copyIcon.alt = 'Copies';
        copyIcon.className = 'chestsimg';
        
        const copyTxt = document.createElement('span');
        copyTxt.className = 'copies-text';
        copyTxt.textContent = copies;
        
        const ofTxt = document.createElement('span');
        ofTxt.className = 'copies-text';
        ofTxt.textContent = ' of ';
        
        const copy2Txt = document.createElement('span');
        copy2Txt.className = 'copies-text';
        copy2Txt.textContent = copies2;
        
        copyContainer.appendChild(copyIcon);
        copyContainer.appendChild(copyTxt);
        copyContainer.appendChild(ofTxt);
        copyContainer.appendChild(copy2Txt);
        chestHeaderClone.appendChild(copyContainer);
    }

    // Helper to create chest elements
    const createChestElement = (value, imgSrc, altText) => {
        if (value <= 0) return null;
        
        const container = document.createElement('div');
        container.className = 'chest-container';
        container.style.display = 'flex';
        
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = altText;
        img.className = 'chestsimg';
        
        const text = document.createElement('span');
        text.className = 'chests';
        text.textContent = value;
        
        container.appendChild(img);
        container.appendChild(text);
        return container;
    };

    // Create chest elements
    const smEl = createChestElement(smValue, 'chests1.png', 'Small Chest');
    const mdEl = createChestElement(mdValue, 'chests2.png', 'Medium Chest');
    const lgEl = createChestElement(lgValue, 'chests3.png', 'Large Chest');
    const xlEl = createChestElement(xlValue, 'chests4.png', 'Extra Large Chest');
    
    if (smEl) chestHeaderClone.appendChild(smEl);
    if (mdEl) chestHeaderClone.appendChild(mdEl);
    if (lgEl) chestHeaderClone.appendChild(lgEl);
    if (xlEl) chestHeaderClone.appendChild(xlEl);

    // Add the new header to the card
    card.appendChild(chestHeaderClone);
    
    // --- END: ADDED CHEST/COPY HEADER ---

    const content = document.createElement('div');
    content.className = 'map-card-content';

    const boardState = {
        tiles: convertFlatTo2D(mapData.mapData.tiles)
    };
    
    const rotate90 = rotateBoardState(boardState);
    const rotate180 = rotateBoardState(rotate90);
    const rotate270 = rotateBoardState(rotate180);

    const windowClone = document.createElement('div');
    windowClone.className = 'window-clone';
    
    const column1 = document.createElement('div');
    column1.className = 'column';
    const boardTL = document.createElement('div');
    const boardBL = document.createElement('div');
    column1.appendChild(boardTL);
    column1.appendChild(boardBL);

    const column2 = document.createElement('div');
    column2.className = 'column';
    const boardTR = document.createElement('div');
    const boardBR = document.createElement('div');
    column2.appendChild(boardTR);
    column2.appendChild(boardBR);

    windowClone.appendChild(column1);
    windowClone.appendChild(column2);

    displayBoard(boardState, boardTL);
    displayBoard(rotate270, boardTR);
    displayBoard(rotate180, boardBR);
    displayBoard(rotate90, boardBL);

    content.appendChild(windowClone);
    card.appendChild(content);

    // --- Notes Section (Custom + Default) ---
    const notesSection = document.createElement('div');
    notesSection.className = 'map-card-notes';

    // Add custom notes if they exist
    if (mapData.notesHtml && mapData.notesHtml.trim() !== '') {
        const customNotesContainer = document.createElement('div');
        customNotesContainer.className = 'ql-snow';
        customNotesContainer.innerHTML = `<div class="ql-editor">${mapData.notesHtml}</div>`;
        notesSection.appendChild(customNotesContainer);
    }

    // Add default notes (styled via CSS)
    const defaultNote1 = document.createElement('div');
    defaultNote1.className = 'map-card-default-note-1';
    defaultNote1.textContent = 'Green spots have treasure chests.';
    
    const defaultNote2 = document.createElement('div');
    defaultNote2.className = 'map-card-default-note-2';
    defaultNote2.textContent = 'Brown spots don\'t have treasure chests.';
    
    notesSection.appendChild(defaultNote1);
    notesSection.appendChild(defaultNote2);
    
    card.appendChild(notesSection);
 
     return card;
}