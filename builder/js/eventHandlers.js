import { state } from './state.js';
import { CONFIG } from './config.js';
import { getBoardData, generateBoardCodeObject, rotateBoardState } from './dataProcessing.js';
import { displayBoard, updateHeaderAndFooter } from './boardDisplay.js';
import { updateVisualTileBackground, updateVisualTileBorder } from './tileVisuals.js';
import { showStatus, normalizeBorderInput } from './utils.js';
import { clearCurrentEditingMap } from './searchTab.js';
import { checkMapForDuplicates } from './duplicateCheck.js'; 
import { validateAllTilesForGeneration } from './validation.js'; 


export function setupEventListeners() {
    // Generate button
    const generateBtn = document.getElementById('generateButton');
    if (generateBtn) generateBtn.addEventListener('click', handleGenerate);

    // Clear all button
    document.getElementById('clearAllButton').addEventListener('click', handleClearAll);
    
    // Save to DB
    const saveBtn = document.getElementById('saveToDbButton');
    if (saveBtn) saveBtn.addEventListener('click', handleSaveToDatabase);

    // Code I/O (legacy/debug)
    const loadBtn = document.getElementById('loadBoardButton');
    if (loadBtn) loadBtn.addEventListener('click', handleLoadBoard);
    
    const copyBtn = document.getElementById('copyCodeButton');
    if (copyBtn) copyBtn.addEventListener('click', handleCopyCode);

    // Search tab listeners (moved to searchTab.js)
    setupSearchListeners();
    
    setupBuilderIncrementDecrement();
    const dirtyListener = () => {
    const updateBtn = document.getElementById('updateMapButton');
    if (updateBtn && updateBtn.style.display !== 'none') {
        updateBtn.disabled = false;
    }
};

state.elements.boardForm.addEventListener('input', dirtyListener);
state.elements.chestForm.addEventListener('input', dirtyListener);
}

export function handleGenerate(event) {
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }
    
     const validationError = validateAllTilesForGeneration();
    if (validationError) {
        showStatus(validationError, 'error');
        return; // Stop generation
    }

    const boardState = getBoardData();
    const rotate90 = rotateBoardState(boardState);
    const rotate180 = rotateBoardState(rotate90);
    const rotate270 = rotateBoardState(rotate180);

    displayBoard(boardState, "boardTL");
    displayBoard(rotate270, "boardTR");
    displayBoard(rotate180, "boardBR");
    displayBoard(rotate90, "boardBL");
    updateHeaderAndFooter();

    const boardCodeObject = generateBoardCodeObject();
    
    if (state.elements.boardCodeArea) {
        state.elements.boardCodeArea.value = JSON.stringify(boardCodeObject, null, 4);
    }

    const saveControls = document.getElementById('saveControls');
    if (saveControls) {
        saveControls.style.display = 'block';
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) saveStatus.textContent = '';
        const saveBtn = document.getElementById('saveToDbButton');
        if (saveBtn) saveBtn.disabled = false;
    }
}

export async function handleSaveToDatabase() {
    const saveBtn = document.getElementById('saveToDbButton');
    const saveStatus = document.getElementById('saveStatus');
    
    if (!saveBtn || !saveStatus) return;

    saveBtn.disabled = true;
    showStatus("Saving...", 'info');

    try {
        const mapData = generateBoardCodeObject();
        
        // --- DUPLICATE CHECK ---
        showStatus("Checking for duplicates...", 'info');
        const duplicate = await checkMapForDuplicates(mapData, null); // Check against all maps
        if (duplicate.isDuplicate) {
            throw new Error(`This map is a duplicate of map ID: ${duplicate.mapId}`);
        }
        // --- END DUPLICATE CHECK ---

        showStatus("Saving to database...", 'info');

        let notesHtml = "";
        if (state.quillEditor && state.quillEditor.getLength() > 1) {
            notesHtml = state.quillEditor.root.innerHTML;
        }

        const firebaseModule = await import('./database.js');
        
        if (!firebaseModule.saveMapToDatabase) {
            throw new Error("Database functions not available.");
        }

        const mapId = await firebaseModule.saveMapToDatabase(mapData, notesHtml);

        showStatus(`Map saved successfully! ID: ${mapId}`, 'success');
        
        handleClearAll(); 

    } catch (error) {
        console.error("Error during database save operation:", error);
        showStatus(`Error saving map: ${error.message}`, 'error');
        saveBtn.disabled = false;
    }
}

export function handleClearAll() {
    state.elements.boardForm.reset();
    state.elements.chestForm.reset();

    clearCurrentEditingMap();

    ['boardTL', 'boardTR', 'boardBR', 'boardBL'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '';
            element.className = '';
        }
    });

    const chestHeader = document.getElementById('chestheader');
    if (chestHeader) chestHeader.style.display = 'none';
    const chestFooter = document.getElementById('chestfooter');
    if (chestFooter) chestFooter.style.display = 'none';

    const visualTiles = state.elements.gridContainer.querySelectorAll('.tile-visual');
    const defaultValue = CONFIG.TILE_OPTIONS[0].value;
    const defaultBorder = CONFIG.BORDER_OPTIONS[0].value;

    visualTiles.forEach(tile => {
        updateVisualTileBackground(tile, defaultValue);
        tile.classList.remove('vis-treasure', 'vis-star', 'vis-bulb');
        updateVisualTileBorder(tile, defaultBorder);
        
        const container = tile.closest('.tile-input-container');
        if (container) {
            container.classList.remove('error');
        }
    });

    state.elements.gridContainer.querySelectorAll('.icon-select-label').forEach(icon => {
        icon.classList.remove('is-active');
    });

    const exactCopyRadio = document.getElementById('exactCopy');
    if (exactCopyRadio) exactCopyRadio.checked = true;
    
    if (state.elements.boardCodeArea) state.elements.boardCodeArea.value = '';

    if (state.quillEditor) {
        state.quillEditor.setText('');
    }

    const saveControls = document.getElementById('saveControls');
    if (saveControls) saveControls.style.display = 'none';
}

function handleLoadBoard() {
    if (!state.elements.boardCodeArea) return;
    const code = state.elements.boardCodeArea.value.trim();

    if (!code) {
        alert("Please paste a board code into the text area.");
        return;
    }

    try {
        const boardData = JSON.parse(code);
        loadBoardFromData(boardData);
    } catch (error) {
        console.error("Error loading board code:", error);
        alert("Invalid board code format. Error: " + error.message);
    }
}

function handleCopyCode() {
    if (!state.elements.boardCodeArea || !state.elements.boardCodeArea.value) {
        alert("No code to copy.");
        return;
    }

    navigator.clipboard.writeText(state.elements.boardCodeArea.value).then(() => {
        const copyBtn = document.getElementById('copyCodeButton');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 1500);
        }
    }).catch(err => {
        alert("Failed to copy code.");
        });
}

export function loadBoardFromData(data) {
    if (!data || !Array.isArray(data.tiles) || data.tiles.length !== CONFIG.GRID_SIZE * CONFIG.GRID_SIZE) {
        throw new Error("Invalid board data structure or tile count.");
    }

    handleClearAll();

    // Load chest form data
    const chestElements = state.elements.chestForm.elements;
    const setSelectValue = (name, value) => {
        const element = chestElements[name];
        if (element) {
            const strValue = String(value ?? 0);
            if ([...element.options].some(opt => opt.value === strValue)) {
                element.value = strValue;
            }
        }
    };

    setSelectValue('copies', data.numberOf);
    setSelectValue('copies2', data.outOf);
    setSelectValue('smallChests', data.sm);
    setSelectValue('mediumChests', data.md);
    setSelectValue('largeChests', data.lg);
    setSelectValue('extraLargeChests', data.xl);

    const almostCopyRadio = document.getElementById('almostCopy');
    const exactCopyRadio = document.getElementById('exactCopy');

    if (data.isAlmostCopy) {
        if (almostCopyRadio) almostCopyRadio.checked = true;
    } else {
        if (exactCopyRadio) exactCopyRadio.checked = true;
    }

    // Load tile data
    const boardElements = state.elements.boardForm.elements;

    for (let i = 0; i < data.tiles.length; i++) {
        const tileData = data.tiles[i];
        const index = i + 1;
        
        const tileType = tileData.type; 
        const borderValue = normalizeBorderInput(tileData.border);

        const stateEl = boardElements[`tileState${index}`];
        if (stateEl) {
            if (CONFIG.TILE_OPTIONS.some(opt => opt.value === tileType)) {
                stateEl.value = tileType;
            } else {
                stateEl.value = 'blank';
            }
        }

        if (boardElements[`treasure${index}`]) boardElements[`treasure${index}`].checked = !!tileData.hasTreasure;
        if (boardElements[`star${index}`]) boardElements[`star${index}`].checked = !!tileData.hasStar;
        if (boardElements[`bulb${index}`]) boardElements[`bulb${index}`].checked = !!tileData.hasBulb;
        
        const borderEl = boardElements[`border${index}`];
        if (borderEl) {
            if (CONFIG.BORDER_OPTIONS.some(opt => opt.value === borderValue)) {
                borderEl.value = borderValue;
            } else {
                borderEl.value = 'none';
            }
        }

        // Update visual tile
        const visualTile = document.getElementById(`visualTile${index}`);
        if (visualTile) {
            updateVisualTileBackground(visualTile, stateEl.value);
            visualTile.classList.toggle('vis-treasure', !!tileData.hasTreasure);
            visualTile.classList.toggle('vis-star', !!tileData.hasStar);
            visualTile.classList.toggle('vis-bulb', !!tileData.hasBulb);
            updateVisualTileBorder(visualTile, borderEl.value);

            const borderLabel = document.getElementById(`borderLabel${index}`);
            if (borderLabel) {
                borderLabel.classList.toggle('is-active', borderEl.value !== 'none');
            }
        }
    }
    
    handleGenerate(); 
}

function setupBuilderIncrementDecrement() {
    // Find the builder form
    const builderForm = document.getElementById('chestForm');
    if (!builderForm) return;

    const handleIncrement = (e) => {
        // The <select> is the element *before* the increment button
        const select = e.target.previousElementSibling;
        if (select && select.tagName === 'SELECT') {
            if (select.selectedIndex < select.options.length - 1) {
                select.selectedIndex += 1;
            }
        }
    };

    const handleDecrement = (e) => {
        // The <select> is the element *after* the decrement button
        const select = e.target.nextElementSibling;
        if (select && select.tagName === 'SELECT') {
            if (select.selectedIndex > 0) {
                select.selectedIndex -= 1;
            }
        }
    };

    // Use event delegation on the form
    builderForm.addEventListener('click', (e) => {
        if (e.target.classList.contains('increment')) {
            handleIncrement(e);
        } else if (e.target.classList.contains('decrement')) {
            handleDecrement(e);
        }
    });
}

// Import search listeners from searchTab.js
import { setupSearchListeners } from './searchTab.js';