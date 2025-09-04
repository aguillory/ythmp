// script.js

// Global reference to the Quill editor instance
let quillEditor; 

// --- Configuration ---
const CONFIG = {
    GRID_SIZE: 5,
    TILE_OPTIONS: [
        { value: "blank", text: "Blank" },
        { value: "one", text: "1" }, { value: "two", text: "2" },
        { value: "three", text: "3" }, { value: "four", text: "4" },
        { value: "five", text: "5" }, { value: "six", text: "6" },
        { value: "threex", text: "3x" }, { value: "fourx", text: "4x" },
        { value: "yahtzee", text: "Yahtzee" }, { value: "chance", text: "?" },
        { value: "pair", text: "2 Pair" }, { value: "odds", text: "Odds" },
        { value: "evens", text: "Evens" }, { value: "full", text: "Full House" },
        { value: "sm", text: "Sm Straight" }, { value: "lg", text: "Lg Straight" }
    ],
    BORDER_OPTIONS: [
        { value: "none", text: "None" },
        { value: "black", text: "Black" },
        { value: "brown", text: "Brown" },
        { value: "silver", text: "Silver" },
        { value: "purple", text: "Purple" },
        { value: "gold", text: "Gold" }
    ],
    // NEW: Configuration for chest counts (used for populating search dropdowns)
    CHEST_COUNTS: {
        small: { min: 0, max: 11 },
        medium: { min: 0, max: 4 },
        large: { min: 0, max: 4 },
        extraLarge: { min: 0, max: 4 }
    }
};
// --- DOM Elements & State ---
let boardForm, chestForm, gridContainer, boardCodeArea;
// NEW: Elements for the Edit/View tab
let searchChestForm, mapListContainer;

let isInitialized = false; // Flag to prevent re-initialization


// Define the main initialization function and expose it globally.
// This is called by app.js when the user is authenticated.
window.initializeBoardBuilder = function() {
    if (isInitialized) return;
    
    // Initialize DOM elements now that the app container is visible
    boardForm = document.getElementById('boardForm');
    chestForm = document.getElementById('chestForm');
    gridContainer = document.querySelector('.grid');
    boardCodeArea = document.getElementById('boardCodeArea');

    // NEW: Initialize Edit/View tab elements
    searchChestForm = document.getElementById('searchChestForm');
    mapListContainer = document.getElementById('mapListContainer');

    if (!boardForm || !chestForm || !gridContainer || !searchChestForm) {
        console.error("Could not find essential DOM elements. Initialization aborted.");
        return;
    }

    generateGridInputs();
    setupEventListeners();
    initializeRTE();
    setupTabNavigation();
    
    // NEW: Initialize the search interface
    initializeSearchInterface();

    isInitialized = true;
}


// --- Initialization Helpers ---

function initializeRTE() {
    if (typeof Quill === 'undefined') {
        console.error("Quill library not loaded.");
        return;
    }
    
    // UPDATED: Added color and background color options
    const toolbarOptions = [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }], // Color options
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'clean']
    ];

    quillEditor = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: toolbarOptions
        },
        placeholder: 'Enter notes or strategies...'
    });
}

function setupTabNavigation() {
    const tabLinks = document.querySelectorAll('.tablink');
    
    const openTab = (event, tabId) => {
        // Hide all tab contents
        document.querySelectorAll('.tabcontent').forEach(content => {
            content.style.display = 'none';
        });

        // Remove 'active' class from all links
        tabLinks.forEach(l => {
            l.classList.remove('active');
        });

        // Show the current tab and add 'active' class
        document.getElementById(tabId).style.display = 'block';
        if (event) {
            event.currentTarget.classList.add('active');
        }
    };

    tabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const tabId = event.target.getAttribute('data-tab');
            openTab(event, tabId);
        });
    });

    // Ensure the first tab is visible on load
    if (document.getElementById('newMapTab')) {
         openTab(null, 'newMapTab');
         if (tabLinks.length > 0) tabLinks[0].classList.add('active');
    }
}



// --- Grid Generation (Remains the same as the original logic) ---

function generateGridInputs() {
    // Prevent regeneration if already populated
    if (gridContainer.children.length > 0) return;

    const totalTiles = CONFIG.GRID_SIZE * CONFIG.GRID_SIZE;
    const fragment = document.createDocumentFragment();

    for (let i = 1; i <= totalTiles; i++) {
        const tileContainer = document.createElement('div');
        tileContainer.className = 'tile-input-container';
        
        // 1. Create the dropdown (select)
        const select = document.createElement('select');
        select.name = `tileState${i}`;
        CONFIG.TILE_OPTIONS.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            select.appendChild(option);
        });

        // 2. Visual representation
        const visualTile = document.createElement('div');
        const initialValue = CONFIG.TILE_OPTIONS[0].value.toLowerCase();
        visualTile.id = `visualTile${i}`; 
        visualTile.className = `tile-visual tile-bg ${initialValue}`;

        // Event listener for dynamic tile background update
        select.addEventListener('change', (event) => {
            updateVisualTileBackground(visualTile, event.target.value);
        });

        
        // 3. Checkboxes and Border Selector
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'input-checkbox-container';

        const treasureCheckbox = createIconCheckbox(`treasure${i}`, 'treasure.png', 'Treasure', visualTile, 'vis-treasure');
        const starCheckbox = createIconCheckbox(`star${i}`, 'star.png', 'Star', visualTile, 'vis-star');
        const bulbCheckbox = createIconCheckbox(`bulb${i}`, 'bulb.png', 'Bulb', visualTile, 'vis-bulb');
        const borderSelector = createBorderSelector(`border${i}`, visualTile);

        checkboxContainer.appendChild(treasureCheckbox);
        checkboxContainer.appendChild(starCheckbox);
        checkboxContainer.appendChild(bulbCheckbox);
        checkboxContainer.appendChild(borderSelector);


        // Append inputs to the tile container
        tileContainer.appendChild(select);
        tileContainer.appendChild(visualTile);
        tileContainer.appendChild(checkboxContainer);
        
        fragment.appendChild(tileContainer);
    }
    gridContainer.appendChild(fragment);
}

// Helper functions (createIconCheckbox, createBorderSelector, updateVisualTileBackground, updateVisualTileBorder)

function createIconCheckbox(name, iconSrc, altText, visualTile, visualizationClass) {
    const label = document.createElement('label');
    label.className = 'icon-checkbox';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = name;
    
    checkbox.addEventListener('change', (event) => {
        visualTile.classList.toggle(visualizationClass, event.target.checked);
    });

    const icon = document.createElement('img');
    icon.src = iconSrc;
    icon.alt = altText;
    icon.title = altText;

    label.appendChild(checkbox);
    label.appendChild(icon);
    return label;
};

function createBorderSelector(name, visualTile) {
    const label = document.createElement('label');
    label.className = 'icon-select-label';

    const indexMatch = name.match(/\d+/); 
    if (indexMatch) {
        label.id = `borderLabel${indexMatch[0]}`;
    }

    const icon = document.createElement('img');
    icon.src = 'border.png';
    icon.alt = 'Select Border';
    icon.title = 'Select Border';

    const select = document.createElement('select');
    select.name = name;
    select.className = 'border-select';

    CONFIG.BORDER_OPTIONS.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        select.appendChild(option);
    });

    select.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        updateVisualTileBorder(visualTile, selectedValue);
        label.classList.toggle('is-active', selectedValue !== 'none');
    });

    label.appendChild(icon);
    label.appendChild(select);
    return label;
}

function updateVisualTileBackground(visualTile, newValue) {
    CONFIG.TILE_OPTIONS.forEach(opt => {
        visualTile.classList.remove(opt.value.toLowerCase());
    });
    visualTile.classList.add(newValue.toLowerCase());
}

function updateVisualTileBorder(visualTile, newBorderValue) {
    CONFIG.BORDER_OPTIONS.forEach(opt => {
        visualTile.classList.remove(`border-${opt.value.toLowerCase()}`);
    });
    if (newBorderValue !== 'none') {
        visualTile.classList.add(`border-${newBorderValue.toLowerCase()}`);
    }
}

// --- Event Listeners ---

function setupEventListeners() {
    // UPDATED: Switched from form submit to button click listener due to HTML restructure
    const generateBtn = document.getElementById('generateButton');
    if (generateBtn) generateBtn.addEventListener('click', handleGenerate);

    document.getElementById('clearAllButton').addEventListener('click', handleClearAll);
    
    // Save to DB listener
    const saveBtn = document.getElementById('saveToDbButton');
    if (saveBtn) saveBtn.addEventListener('click', handleSaveToDatabase);

    // Existing Code I/O listeners
    const loadBtn = document.getElementById('loadBoardButton');
    if (loadBtn) loadBtn.addEventListener('click', handleLoadBoard);
    
    const copyBtn = document.getElementById('copyCodeButton');
    if (copyBtn) copyBtn.addEventListener('click', handleCopyCode);

    // NEW: Event listeners for the Edit/View tab
    if (searchChestForm) {
        searchChestForm.addEventListener('submit', handleShowMaps);
    }
    const clearSearchBtn = document.getElementById('clearSearchButton');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', handleClearSearch);
    }
    // NEW: Column selector listener
    const columnSelector = document.getElementById('columnSelector');
    if (columnSelector) {
        columnSelector.addEventListener('change', handleColumnChange);
    }
}

// --- Event Handlers (New Map Tab) ---

function handleGenerate(event) {
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    // 1. Get Data and Calculate Rotations
    const boardState = getBoardData();
    const rotate90 = rotateBoardState(boardState);
    const rotate180 = rotateBoardState(rotate90);
    const rotate270 = rotateBoardState(rotate180);

    // 2. Display Results
    displayBoard(boardState,"boardTL");
    displayBoard(rotate270,"boardTR");
    displayBoard(rotate180,"boardBR");
    displayBoard(rotate90,"boardBL");
    updateHeaderAndFooter();

    // 3. Generate the board code object (used for saving)
    const boardCodeObject = generateBoardCodeObject();
    
    // Display in debug area if visible
    if (boardCodeArea) {
        boardCodeArea.value = JSON.stringify(boardCodeObject, null, 4);
    }

    // 4. Show the Save Controls
    const saveControls = document.getElementById('saveControls');
    if (saveControls) {
        saveControls.style.display = 'block';
        // Clear previous save status
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) saveStatus.textContent = '';
         // Re-enable save button if it was disabled
        const saveBtn = document.getElementById('saveToDbButton');
        if (saveBtn) saveBtn.disabled = false;
    }
}

// Handler for saving to the database
async function handleSaveToDatabase() {
    // We use dynamic import to access the module functions in app.js.

    const saveBtn = document.getElementById('saveToDbButton');
    const saveStatus = document.getElementById('saveStatus');
    
    if (!saveBtn || !saveStatus) return;

    saveBtn.disabled = true;
    saveStatus.textContent = "Saving...";
    saveStatus.style.color = "black";

    try {
        // 1. Get the data
        const mapData = generateBoardCodeObject();
        
        // Get HTML content from the RTE, only if there is content
        let notesHtml = "";
        if (quillEditor && quillEditor.getLength() > 1) {
             notesHtml = quillEditor.root.innerHTML;
        }

        // REMOVED: Title input fetching.

        // 2. Dynamically import the database functions from app.js
        const firebaseModule = await import('./app.js');
        
        if (!firebaseModule.saveMapToDatabase) {
            throw new Error("Database functions not available.");
        }

        // 3. Call the save function (updated signature)
        const mapId = await firebaseModule.saveMapToDatabase(mapData, notesHtml);

        // 4. Success feedback
        saveStatus.textContent = `Map saved successfully! ID: ${mapId}`;
        saveStatus.style.color = "green";
        
        // Clear the form after successful save, as this is the "New Map" tab.
        handleClearAll(); 

    } catch (error) {
        console.error("Error during database save operation:", error);
        saveStatus.textContent = `Error saving map: ${error.message}`;
        saveStatus.style.color = "red";
        saveBtn.disabled = false; // Re-enable button on failure
    }
}


function handleClearAll() {
    // Reset forms
    boardForm.reset();
    chestForm.reset();

    // Clear outputs
    ['boardTL', 'boardTR', 'boardBR', 'boardBL'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '';
            element.className = '';
        }
    });

    // Hide headers/footers
    const chestHeader = document.getElementById('chestheader');
    if (chestHeader) chestHeader.style.display = 'none';
    const chestFooter = document.getElementById('chestfooter');
    if (chestFooter) chestFooter.style.display = 'none';

    // Reset visual tiles
    const visualTiles = gridContainer.querySelectorAll('.tile-visual');
    const defaultValue = CONFIG.TILE_OPTIONS[0].value;
    const defaultBorder = CONFIG.BORDER_OPTIONS[0].value;

    visualTiles.forEach(tile => {
        updateVisualTileBackground(tile, defaultValue);
        tile.classList.remove('vis-treasure', 'vis-star', 'vis-bulb');
        updateVisualTileBorder(tile, defaultBorder);
    });

    // Reset border icon appearance
    gridContainer.querySelectorAll('.icon-select-label').forEach(icon => {
        icon.classList.remove('is-active');
    });

    // Ensure default radio buttons are checked
    const exactCopyRadio = document.getElementById('exactCopy');
    if (exactCopyRadio) exactCopyRadio.checked = true;
    
    // Clear the code area
    if (boardCodeArea) boardCodeArea.value = '';

    // Clear the RTE
    if (quillEditor) {
        quillEditor.setText('');
    }

    // REMOVED: Clear the title input (no longer exists)

    // Hide the Save Controls
    const saveControls = document.getElementById('saveControls');
    if (saveControls) saveControls.style.display = 'none';
}

// Handlers for Code I/O (Used only for the hidden debug/legacy panel now)

function handleLoadBoard() {
    if (!boardCodeArea) return;
    const code = boardCodeArea.value.trim();

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
    if (!boardCodeArea || !boardCodeArea.value) {
        alert("No code to copy.");
        return;
    }

    navigator.clipboard.writeText(boardCodeArea.value).then(() => {
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


// --- Data Processing Functions ---
// (getBoardData, getFlatTileData, convertTo2DArray, rotateBoardState) remain unchanged.

function getBoardData() {
    const tilesData = getFlatTileData();
    return {
        tiles: convertTo2DArray(tilesData),
    };
}

function getFlatTileData() {
    const tilesData = [];
    const elements = boardForm.elements;

    for (let i = 1; i <= CONFIG.GRID_SIZE * CONFIG.GRID_SIZE; i++) {
        const stateEl = elements[`tileState${i}`];
        const treasureEl = elements[`treasure${i}`];
        const starEl = elements[`star${i}`];
        const bulbEl = elements[`bulb${i}`];
        const borderEl = elements[`border${i}`];

        const state = stateEl ? stateEl.value : CONFIG.TILE_OPTIONS[0].value;
        const treasure = treasureEl ? treasureEl.checked : false;
        const star = starEl ? starEl.checked : false;
        const bulb = bulbEl ? bulbEl.checked : false;
        const border = borderEl ? borderEl.value : CONFIG.BORDER_OPTIONS[0].value;

        tilesData.push({
            state: state,
            treasure: treasure,
            star: star,
            bulb: bulb,
            border: border
        });
    }
    return tilesData;
}

function convertTo2DArray(data) {
    const size = CONFIG.GRID_SIZE;
    let boardTiles = [];
    for (let i = 0; i < size; i++) {
        boardTiles.push(data.slice(i * size, (i + 1) * size));
    }
    return boardTiles;
}

// NEW: Helper specifically for the Edit/View tab rendering (converts DB flat array back to internal 2D format)
function convertFlatTo2D(flatTiles) {
    const size = CONFIG.GRID_SIZE;
    let boardTiles = [];
    for (let i = 0; i < size; i++) {
        const row = flatTiles.slice(i * size, (i + 1) * size).map(tileData => {
            // Adapt the database format (DB) to the internal format used by displayBoard
            return {
                state: tileData.type,
                treasure: tileData.hasTreasure,
                star: tileData.hasStar,
                bulb: tileData.hasBulb,
                border: tileData.border.toLowerCase() // Internal format expects lowercase
            };
        });
        boardTiles.push(row);
    }
    return boardTiles;
}

function rotateBoardState(boardState) {
    const size = CONFIG.GRID_SIZE;
    const N = size;

    const oldTiles = boardState.tiles;
    let newTiles = Array.from({ length: size }, () => Array(size).fill(null));

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            // Rotation logic: newTiles[i][j] = oldTiles[N - 1 - j][i]
            newTiles[i][j] = { ...oldTiles[N - 1 - j][i] };
        }
    }

    return {
        tiles: newTiles,
    };
}

// --- Board Code Generation (Refactored) ---

// Refactored to return the object directly (used by handleGenerate and handleSaveToDatabase)
function generateBoardCodeObject() {
    const chestElements = chestForm.elements;
    const flatTileData = getFlatTileData();

    const isAlmostCopy = document.getElementById('almostCopy')?.checked || false;

    const formatBorderOutput = (s) => {
        if (typeof s !== 'string' || s.length === 0 || s.toLowerCase() === 'none') {
            return 'NONE';
        }
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    };

    const formattedTiles = flatTileData.map(tile => ({
        hasTreasure: tile.treasure,
        hasStar: tile.star,
        hasBulb: tile.bulb,
        border: formatBorderOutput(tile.border),
        type: tile.state 
    }));

    const getChestValue = (name) => parseInt(chestElements[name]?.value, 10) || 0;

    const boardCodeObject = {
        isAlmostCopy: isAlmostCopy,
        numberOf: getChestValue('copies'),
        outOf: getChestValue('copies2'),
        sm: getChestValue('smallChests'),
        md: getChestValue('mediumChests'),
        lg: getChestValue('largeChests'),
        xl: getChestValue('extraLargeChests'),
        tiles: formattedTiles
    };

    return boardCodeObject;
}

// --- Board Code Loading Functions (For debug/legacy panel only) ---
// (loadBoardFromData) remains largely unchanged.

function loadBoardFromData(data) {
    if (!data || !Array.isArray(data.tiles) || data.tiles.length !== CONFIG.GRID_SIZE * CONFIG.GRID_SIZE) {
        throw new Error("Invalid board data structure or tile count.");
    }

    handleClearAll();

    // Load Chest Form Data
    const chestElements = chestForm.elements;
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

    // Load Tile Data
    const boardElements = boardForm.elements;

    const normalizeBorderInput = (border) => {
        if (!border || border.toUpperCase() === 'NONE') return 'none';
        return border.toLowerCase();
    };

    for (let i = 0; i < data.tiles.length; i++) {
        const tileData = data.tiles[i];
        const index = i + 1;
        
        const tileType = tileData.type; 
        const borderValue = normalizeBorderInput(tileData.border);

        // Update Form Inputs
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

        // Update Visual Tile
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


// --- Rendering Functions ---
// (displayBoard, updateHeaderAndFooter) remain unchanged.
function displayBoard(boardState, containerRef) {
    let boardContainer;

    if (typeof containerRef === 'string') {
        boardContainer = document.getElementById(containerRef);
    } else if (containerRef instanceof HTMLElement) {
        boardContainer = containerRef;
    }

    if (!boardContainer) return;

    boardContainer.innerHTML = ''; 
    boardContainer.className = 'generatedBoard';

    const fragment = document.createDocumentFragment();

    boardState.tiles.forEach((row) => {
        row.forEach((tile) => {
            const tileDiv = document.createElement('div');
            const tileStateClass = tile.state ? tile.state.toLowerCase() : 'blank';
            tileDiv.className = `generatedTile tile-bg ${tileStateClass}`;

            if (tile.treasure) {
                tileDiv.classList.add('treasureGenerated'); 
            }
            if (tile.star) {
                tileDiv.classList.add('starGenerated');
            }
            if (tile.bulb) {
                tileDiv.classList.add('bulbGenerated');
            }

            // Ensure border is checked correctly
            if (tile.border && tile.border.toLowerCase() !== 'none') {
                tileDiv.classList.add(`border-${tile.border.toLowerCase()}`);
            }

            fragment.appendChild(tileDiv);
        });
    });

    boardContainer.appendChild(fragment);
}

function updateHeaderAndFooter() {
    const elements = chestForm.elements;
    const getValue = (name) => parseInt(elements[name]?.value, 10) || 0;
    
    const copies = getValue('copies');
    const copies2 = getValue('copies2');
    const smValue = getValue('smallChests');
    const mdValue = getValue('mediumChests');
    const lgValue = getValue('largeChests');
    const xlValue = getValue('extraLargeChests');
    
    const isAlmostCopy = document.getElementById('almostCopy')?.checked;
    const selectedCopyIcon = isAlmostCopy ? 'copy2.png' : 'copy.png';

    
    const updateDisplay = (value, txtId, containerId) => {
        const container = document.getElementById(containerId);
        if (container) {
            if (value > 0) {
                const txtElement = document.getElementById(txtId);
                if (txtElement) txtElement.textContent = value;
                container.style.display = 'flex';
            } else {
                container.style.display = 'none';
            }
        }
    };

    // Copies Logic
    const copyContainer = document.getElementById('copy');
    if (copyContainer) {
        if (copies > 0 && copies2 > 0 && copies <= copies2){
            const copyTxt = document.getElementById('copytxt');
            if (copyTxt) copyTxt.textContent = copies;
            const copy2Txt = document.getElementById('copy2txt');
            if (copy2Txt) copy2Txt.textContent = copies2;
            const copyIcon = document.getElementById('copyIcon');
            if (copyIcon) copyIcon.src = selectedCopyIcon;
            copyContainer.style.display = 'flex';
        } else {
            copyContainer.style.display = 'none';
        }
    }

    // Chests Logic
    updateDisplay(smValue, 'smtxt', 'sm');
    updateDisplay(mdValue, 'mdtxt', 'md');
    updateDisplay(lgValue, 'lgtxt', 'lg');
    updateDisplay(xlValue, 'xltxt', 'xl');
    
    // Set overall visibility
    const chestHeader = document.getElementById('chestheader');
    if (chestHeader) {
        chestHeader.style.display = 'flex';
        chestHeader.style.justifyContent = 'center';
    }
    const chestFooter = document.getElementById('chestfooter');
    if (chestFooter) {
        chestFooter.style.display = 'block';
    }
}


// --- NEW: Edit/View Tab Functionality ---

// Initialize the search interface dropdowns
function initializeSearchInterface() {
    const populateDropdown = (selectElement, config) => {
        if (!selectElement) return;
        for (let i = config.min; i <= config.max; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            selectElement.appendChild(option);
        }
    };

    populateDropdown(document.getElementById('searchSmallChests'), CONFIG.CHEST_COUNTS.small);
    populateDropdown(document.getElementById('searchMediumChests'), CONFIG.CHEST_COUNTS.medium);
    populateDropdown(document.getElementById('searchLargeChests'), CONFIG.CHEST_COUNTS.large);
    populateDropdown(document.getElementById('searchExtraLargeChests'), CONFIG.CHEST_COUNTS.extraLarge);

    // NEW: Set initial column layout
    handleColumnChange();
}

// Handle the "Show Maps" button click
async function handleShowMaps(event) {
    event.preventDefault();
    
    if (!mapListContainer) return;

    const sm = document.getElementById('searchSmallChests').value;
    const md = document.getElementById('searchMediumChests').value;
    const lg = document.getElementById('searchLargeChests').value;
    const xl = document.getElementById('searchExtraLargeChests').value;

    const chestSignature = `${sm}.${md}.${lg}.${xl}`;

    mapListContainer.innerHTML = '<p>Loading maps...</p>';

    try {
        // Dynamically import the database functions
        const firebaseModule = await import('./app.js');
        
        if (!firebaseModule.fetchMapsBySignature) {
            throw new Error("Database fetch function not available.");
        }

        const maps = await firebaseModule.fetchMapsBySignature(chestSignature);

        if (maps.length === 0) {
            mapListContainer.innerHTML = '<p>No maps found for this chest combination.</p>';
        } else {
            renderMapList(maps);
        }

    } catch (error) {
        console.error("Error fetching maps:", error);
        mapListContainer.innerHTML = `<p style="color: red;">Error loading maps: ${error.message}</p>`;
    }
}

// Handle the "Clear Search" button click
function handleClearSearch() {
    if (searchChestForm) {
        searchChestForm.reset();
        // Reset column selector to default (2)
        const colSel = document.getElementById('columnSelector');
        if (colSel) colSel.value = '2';
        handleColumnChange();
    }
    if (mapListContainer) {
        mapListContainer.innerHTML = "<p>Select a chest combination and click 'Show Maps'.</p>";
    }
}

// NEW: Handle changes to the column selector dropdown.
function handleColumnChange() {
    const columnSelector = document.getElementById('columnSelector');
    if (columnSelector && mapListContainer) {
        const columns = columnSelector.value;
        // Set attribute used by CSS Grid for layout
        mapListContainer.setAttribute('data-columns', columns);
    }
}

// Render the list of maps returned from the database
function renderMapList(maps) {
    mapListContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();

    maps.forEach(map => {
        const mapCard = createMapCard(map.id, map.data);
        fragment.appendChild(mapCard);
    });

    mapListContainer.appendChild(fragment);
}

// Create a "card" element for a single map in the results list
function createMapCard(mapId, mapData) {
    const card = document.createElement('div');
    card.className = 'map-card';

    // Header (Map ID and controls)
    const header = document.createElement('div');
    header.className = 'map-card-header';
    header.innerHTML = `<h3>Map ID: ${mapId}</h3>`;
    
    // Add a "Load Map" button for convenience
    const loadButton = document.createElement('button');
    loadButton.textContent = 'Load into Editor';
    loadButton.className = 'load-map-button';
    loadButton.addEventListener('click', () => {
        // Switch to the New Map tab
        const newMapTabLink = document.querySelector('.tablink[data-tab="newMapTab"]');
        if (newMapTabLink) {
            newMapTabLink.click();
        }
        // Load the data into the editor
        loadBoardFromData(mapData.mapData);
        // Load notes into the editor
        if (quillEditor && mapData.notesHtml) {
            quillEditor.root.innerHTML = mapData.notesHtml;
        }
        // Note: Saving this will currently create a NEW map. Update functionality would be a future enhancement.
    });
    header.appendChild(loadButton);
    card.appendChild(header);


    // Content (The 4 rotated boards)
    const content = document.createElement('div');
    content.className = 'map-card-content';

    // Prepare the data for displayBoard (Normalize DB format to Internal format)
    const boardState = {
        tiles: convertFlatTo2D(mapData.mapData.tiles)
    };
    
    const rotate90 = rotateBoardState(boardState);
    const rotate180 = rotateBoardState(rotate90);
    const rotate270 = rotateBoardState(rotate180);

    // Create containers for the 4 boards (similar to the Preview section)
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

    // Render the boards into the containers
    displayBoard(boardState, boardTL);
    displayBoard(rotate270, boardTR);
    displayBoard(rotate180, boardBR);
    displayBoard(rotate90, boardBL);

    content.appendChild(windowClone);
    card.appendChild(content);

    // Notes (if any)
    if (mapData.notesHtml && mapData.notesHtml.trim() !== '') {
        const notesSection = document.createElement('div');
        notesSection.className = 'map-card-notes';
        // Use Quill classes to ensure proper display of rich text
        notesSection.innerHTML = `<h4>Notes:</h4><div class="ql-snow"><div class="ql-editor">${mapData.notesHtml}</div></div>`;
        card.appendChild(notesSection);
    }

    return card;
}