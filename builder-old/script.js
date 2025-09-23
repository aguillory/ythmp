document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    
    // Dynamically retrieve the generated tile size (kept in case needed for future features)
    const tileSizeFromCSS = getComputedStyle(document.documentElement).getPropertyValue('--generated-tile-size');
    const generatedTilePixels = parseInt(tileSizeFromCSS, 10) || 42; 

    const CONFIG = {
        GRID_SIZE: 5,
        GENERATED_TILE_PIXELS: generatedTilePixels,
        TILE_OPTIONS: [
            // Replaced "X" (Unused) with "Blank" (white space)
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
        // New Feature: Border Options
        BORDER_OPTIONS: [
            { value: "none", text: "None" },
            { value: "black", text: "Black" },
            { value: "brown", text: "Brown" },
            { value: "silver", text: "Silver" },
            { value: "purple", text: "Purple" },
            { value: "gold", text: "Gold" }
        ]
    };

    // --- DOM Elements & State ---
    const boardForm = document.getElementById('boardForm');
    const chestForm = document.getElementById('chestForm');
    const gridContainer = document.querySelector('.grid');
    // NEW: DOM Elements for Code I/O
    const boardCodeArea = document.getElementById('boardCodeArea');

    
    // State for border selection removed.


    // --- Initialization ---
    initialize();

    function initialize() {
        generateGridInputs();
        setupEventListeners();
        // Initialization of border visualization color removed.
    }

    // --- Grid Generation (Updated Layout and Features) ---

    function generateGridInputs() {
        if (!gridContainer) return;

        const totalTiles = CONFIG.GRID_SIZE * CONFIG.GRID_SIZE;
        const fragment = document.createDocumentFragment();

        for (let i = 1; i <= totalTiles; i++) {
            // Row/Col calculation removed as it's no longer used without border selection

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
            // NEW: Assign an ID for easy access during loading
            visualTile.id = `visualTile${i}`; 
            visualTile.className = `tile-visual tile-bg ${initialValue}`;
            // dataset.row/col removed.

            // Event listener for dynamic tile background update
            select.addEventListener('change', (event) => {
                updateVisualTileBackground(visualTile, event.target.value);
            });

            // Interactive selection listeners (Mouse/Touch) removed.

            
            // 3. Checkboxes and Border Selector
            
            // Container for checkboxes
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'input-checkbox-container';

            // Create the icon checkboxes
            const treasureCheckbox = createIconCheckbox(`treasure${i}`, 'treasure.png', 'Treasure', visualTile, 'vis-treasure');
            const starCheckbox = createIconCheckbox(`star${i}`, 'star.png', 'Star', visualTile, 'vis-star');
            const bulbCheckbox = createIconCheckbox(`bulb${i}`, 'bulb.png', 'Bulb', visualTile, 'vis-bulb');

            // New Feature: Create the border selector
            const borderSelector = createBorderSelector(`border${i}`, visualTile);

            // Append them in the desired order
            checkboxContainer.appendChild(treasureCheckbox);
            checkboxContainer.appendChild(starCheckbox);
            checkboxContainer.appendChild(bulbCheckbox);
            checkboxContainer.appendChild(borderSelector); // Add border selector


            // Append inputs to the tile container
            tileContainer.appendChild(select);
            tileContainer.appendChild(visualTile);
            tileContainer.appendChild(checkboxContainer);
            
            fragment.appendChild(tileContainer);
        }
        gridContainer.appendChild(fragment);
    }

    // Helper to create icon-based checkboxes and link them to visualization
    function createIconCheckbox(name, iconSrc, altText, visualTile, visualizationClass) {
        const label = document.createElement('label');
        label.className = 'icon-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = name;
        
        checkbox.addEventListener('change', (event) => {
            // Toggle the visualization class based on the checked status
            visualTile.classList.toggle(visualizationClass, event.target.checked);
        });

        const icon = document.createElement('img');
        icon.src = iconSrc;
        icon.alt = altText;
        icon.title = altText; // Tooltip

        label.appendChild(checkbox);
        label.appendChild(icon);
        return label;
    };

    // New Feature: Helper to create the border selector UI (Icon overlaid by invisible select)
    function createBorderSelector(name, visualTile) {
        const label = document.createElement('label');
        // Use a specific class for positioning and active state management
        label.className = 'icon-select-label';

        // NEW: Assign ID for easy access during loading/clearing
        // Extract the index from the name (e.g., 'border5' -> '5')
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
        select.className = 'border-select'; // Class used to make it an invisible overlay

        CONFIG.BORDER_OPTIONS.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            select.appendChild(option);
        });

        // Event listener for visualization update
        select.addEventListener('change', (event) => {
            const selectedValue = event.target.value;
            updateVisualTileBorder(visualTile, selectedValue);

            // Update icon appearance based on selection (mimics checkbox behavior)
            label.classList.toggle('is-active', selectedValue !== 'none');
        });

        label.appendChild(icon);
        label.appendChild(select);
        return label;
    }


    // Updates the background image of the visual tile by changing its class
    function updateVisualTileBackground(visualTile, newValue) {
        // Remove previous state classes
        CONFIG.TILE_OPTIONS.forEach(opt => {
            visualTile.classList.remove(opt.value.toLowerCase());
        });
        // Add the new state class
        visualTile.classList.add(newValue.toLowerCase());
    }

    // New Feature: Updates the border of the visual tile
    function updateVisualTileBorder(visualTile, newBorderValue) {
        // Remove previous border classes
        CONFIG.BORDER_OPTIONS.forEach(opt => {
            visualTile.classList.remove(`border-${opt.value.toLowerCase()}`);
        });
        // Add the new border class if it's not 'none'
        if (newBorderValue !== 'none') {
            visualTile.classList.add(`border-${newBorderValue.toLowerCase()}`);
        }
    }

    // --- Event Listeners ---

    function setupEventListeners() {
        boardForm.addEventListener('submit', handleGenerate);
        document.getElementById('clearAllButton').addEventListener('click', handleClearAll);
        
        // Border controls listeners and global selection listeners removed.

        // NEW: Event listeners for Code I/O
        const loadBtn = document.getElementById('loadBoardButton');
        if (loadBtn) loadBtn.addEventListener('click', handleLoadBoard);
        
        const copyBtn = document.getElementById('copyCodeButton');
        if (copyBtn) copyBtn.addEventListener('click', handleCopyCode);
    }

    // --- Event Handlers ---

    function handleGenerate(event) {
        // Prevent default form submission if it's a real event
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }

        // 1. Get Data (tiles)
        const boardState = getBoardData();

        // 2. Calculate Rotations
        const rotate90 = rotateBoardState(boardState);
        const rotate180 = rotateBoardState(rotate90);
        const rotate270 = rotateBoardState(rotate180);

        // 3. Display Results
		displayBoard(boardState,"boardTL");
		displayBoard(rotate270,"boardTR");
		displayBoard(rotate180,"boardBR");
		displayBoard(rotate90,"boardBL");
		
        // 4. Display Header/Footer
		updateHeaderAndFooter();

        // 5. NEW: Generate and display the board code
        generateAndDisplayBoardCode();
    }

    // Client-side clear without page reload
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

        const chestHeader = document.getElementById('chestheader');
        if (chestHeader) chestHeader.style.display = 'none';
        const chestFooter = document.getElementById('chestfooter');
        if (chestFooter) chestFooter.style.display = 'none';


        // Reset visual tiles to default state ('blank') and clear overlays
        const visualTiles = gridContainer.querySelectorAll('.tile-visual');
        const defaultValue = CONFIG.TILE_OPTIONS[0].value;
        const defaultBorder = CONFIG.BORDER_OPTIONS[0].value;

        visualTiles.forEach(tile => {
            updateVisualTileBackground(tile, defaultValue);
            // Manually clear visualization classes (since form.reset() doesn't trigger 'change' events)
            tile.classList.remove('vis-treasure');
            tile.classList.remove('vis-star');
            tile.classList.remove('vis-bulb'); 
            
            // Clear custom borders
            updateVisualTileBorder(tile, defaultBorder);
        });

        // Reset border icon appearance
        const borderIcons = gridContainer.querySelectorAll('.icon-select-label');
        borderIcons.forEach(icon => {
            icon.classList.remove('is-active');
        });

        // Ensure default radio buttons are checked after reset
        const exactCopyRadio = document.getElementById('exactCopy');
        if (exactCopyRadio) exactCopyRadio.checked = true;
        
        // NEW: Clear the code area
        if (boardCodeArea) boardCodeArea.value = '';
    }


    // NEW: Handler for loading the board from code
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
            // Optional: Provide user feedback
            console.log("Board loaded successfully.");
        } catch (error) {
            console.error("Error loading board code:", error);
            alert("Invalid board code format. Please ensure the code is valid JSON and try again. Error: " + error.message);
        }
    }

    // NEW: Handler for copying the code to clipboard
    function handleCopyCode() {
        if (!boardCodeArea || !boardCodeArea.value) {
            alert("No code to copy. Please generate a board first.");
            return;
        }

        // Modern approach using Clipboard API
        navigator.clipboard.writeText(boardCodeArea.value).then(() => {
            // Provide feedback (e.g., change button text temporarily)
            const copyBtn = document.getElementById('copyCodeButton');
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 1500);
            }
        }).catch(err => {
            console.error('Could not copy text: ', err);
            alert("Failed to copy code. Please copy it manually.");
        });
    }


    // --- Data Processing Functions ---

    // Extract data from the input grid (for internal rotation/display use)
    function getBoardData() {
        const tilesData = getFlatTileData(); // Use the helper
        
        // Return the complete state
        return {
            tiles: convertTo2DArray(tilesData),
        };
    }

    // NEW: Helper to get flat tile data (used by getBoardData and generateBoardCode)
    // Uses direct element access for efficiency and reliability
    function getFlatTileData() {
        const tilesData = [];
        const elements = boardForm.elements;

        for (let i = 1; i <= CONFIG.GRID_SIZE * CONFIG.GRID_SIZE; i++) {
            // Safely access elements
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

            // Note: We keep the internal representation (lowercase values) here
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


    // Convert flat array data into a 5x5 grid structure
    function convertTo2DArray(data) {
        const size = CONFIG.GRID_SIZE;
        let boardTiles = [];
        for (let i = 0; i < size; i++) {
            // Slice the relevant portion of the flat array for the row
            boardTiles.push(data.slice(i * size, (i + 1) * size));
        }
        return boardTiles;
    }

    // Rotate the board state 90 degrees clockwise (Handles tiles)
    function rotateBoardState(boardState) {
        const size = CONFIG.GRID_SIZE;
        const N = size; // Alias for clarity in coordinate formulas

        // 1. Rotate Tiles (Standard matrix rotation)
        const oldTiles = boardState.tiles;
        // Initialize newTiles with the correct structure
        let newTiles = Array.from({ length: size }, () => Array(size).fill(null));

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                // Rotation logic: newTiles[i][j] = oldTiles[N - 1 - j][i]
                // Important: Clone the object to ensure rotations don't affect the original state by reference
                newTiles[i][j] = { ...oldTiles[N - 1 - j][i] };
            }
        }

        return {
            tiles: newTiles,
        };
    }

    // --- NEW: Board Code Generation Functions ---

    // NEW: Generate the board code based on the current state and display it
    function generateAndDisplayBoardCode() {
        // Get data from chestForm elements directly
        const chestElements = chestForm.elements;
        const flatTileData = getFlatTileData();

        // Determine if it's an almost copy
        const isAlmostCopy = document.getElementById('almostCopy')?.checked || false;

        // Helper to format border names according to requirements (e.g., 'Silver' or 'NONE')
        const formatBorderOutput = (s) => {
            if (typeof s !== 'string' || s.length === 0 || s.toLowerCase() === 'none') {
                return 'NONE';
            }
            // Capitalize first letter (e.g. 'silver' -> 'Silver')
            return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        };

        // Format the tiles according to the requested JSON structure
        const formattedTiles = flatTileData.map(tile => ({
            hasTreasure: tile.treasure,
            hasStar: tile.star,
            hasBulb: tile.bulb,
            border: formatBorderOutput(tile.border),
            // 'type' corresponds to the internal 'state' (e.g., "yahtzee", "threex")
            // We use the internal representation for consistency.
            type: tile.state 
        }));

        // Helper to safely parse chest values
        const getChestValue = (name) => parseInt(chestElements[name]?.value, 10) || 0;

        // Construct the final object
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

        // Convert to a nicely formatted JSON string (using 4 spaces for indentation)
        const boardCodeString = JSON.stringify(boardCodeObject, null, 4);

        // Display the code
        if (boardCodeArea) {
            boardCodeArea.value = boardCodeString;
        }
    }

    // --- NEW: Board Code Loading Functions ---

    // NEW: Load the board state from the parsed JSON data
    function loadBoardFromData(data) {
        // Basic Validation
        if (!data || !Array.isArray(data.tiles) || data.tiles.length !== CONFIG.GRID_SIZE * CONFIG.GRID_SIZE) {
            throw new Error("Invalid board data structure or tile count (must be 25).");
        }

        // 1. Clear current state before loading new data
        handleClearAll();

        // 2. Load Chest Form Data
        const chestElements = chestForm.elements;
        // Helper to safely set values, ensuring they exist in the options
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

        // 3. Load Tile Data
        const boardElements = boardForm.elements;

        // Helper to map the JSON format back to internal format (e.g., 'NONE' or 'Silver' -> 'none' or 'silver')
        const normalizeBorderInput = (border) => {
            if (!border || border.toUpperCase() === 'NONE') return 'none';
            return border.toLowerCase();
        };

        for (let i = 0; i < data.tiles.length; i++) {
            const tileData = data.tiles[i];
            const index = i + 1; // IDs and names are 1-based
            
            // We assume the type matches the internal representation (e.g., "threex")
            const tileType = tileData.type; 
            const borderValue = normalizeBorderInput(tileData.border);

            // Update Form Inputs (Check existence before access)
            const stateEl = boardElements[`tileState${index}`];
            if (stateEl) {
                 // Validate type before setting
                 if (CONFIG.TILE_OPTIONS.some(opt => opt.value === tileType)) {
                     stateEl.value = tileType;
                 } else {
                     console.warn(`Invalid tile type loaded: ${tileType}. Defaulting to blank.`);
                     stateEl.value = 'blank';
                 }
            }

            if (boardElements[`treasure${index}`]) boardElements[`treasure${index}`].checked = !!tileData.hasTreasure;
            if (boardElements[`star${index}`]) boardElements[`star${index}`].checked = !!tileData.hasStar;
            if (boardElements[`bulb${index}`]) boardElements[`bulb${index}`].checked = !!tileData.hasBulb;
            
            const borderEl = boardElements[`border${index}`];
            if (borderEl) {
                // Validate border before setting
                if (CONFIG.BORDER_OPTIONS.some(opt => opt.value === borderValue)) {
                    borderEl.value = borderValue;
                } else {
                    console.warn(`Invalid border value loaded: ${tileData.border}. Defaulting to none.`);
                    borderEl.value = 'none';
                }
            }

            // Update Visual Tile (Relies on IDs assigned during initialization)
            const visualTile = document.getElementById(`visualTile${index}`);
            if (visualTile) {
                // Update background (use the validated value from the element)
                updateVisualTileBackground(visualTile, stateEl.value);
                
                // Update overlays (Treasure/Star/Bulb)
                visualTile.classList.toggle('vis-treasure', !!tileData.hasTreasure);
                visualTile.classList.toggle('vis-star', !!tileData.hasStar);
                visualTile.classList.toggle('vis-bulb', !!tileData.hasBulb);

                // Update border (use the validated value)
                updateVisualTileBorder(visualTile, borderEl.value);

                // Update border icon appearance
                const borderLabel = document.getElementById(`borderLabel${index}`);
                if (borderLabel) {
                    borderLabel.classList.toggle('is-active', borderEl.value !== 'none');
                }
            }
        }
        
        // Automatically generate the rotations after loading for immediate feedback
        handleGenerate(); 
    }


    // --- Rendering Functions ---

    function displayBoard(boardState, containerId) {
        const boardContainer = document.getElementById(containerId);
        if (!boardContainer) return;

        boardContainer.innerHTML = ''; 
        boardContainer.className = 'generatedBoard';

        const fragment = document.createDocumentFragment();

        // 1. Render Tiles
        boardState.tiles.forEach((row) => {
            row.forEach((tile) => {
                const tileDiv = document.createElement('div');
                // Use tile-bg class here as well
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

                // Apply custom border
                if (tile.border && tile.border !== 'none') {
                    tileDiv.classList.add(`border-${tile.border.toLowerCase()}`);
                }

                fragment.appendChild(tileDiv);
            });
        });

        boardContainer.appendChild(fragment);
    }

    // (updateHeaderAndFooter refactored for robustness)
    function updateHeaderAndFooter() {
        // Use direct element access for better performance and reliability
        const elements = chestForm.elements;

        // Helper to safely parse values
        const getValue = (name) => parseInt(elements[name]?.value, 10) || 0;
        
        // Parse values
        const copies = getValue('copies');
		const copies2 = getValue('copies2');
		const smValue = getValue('smallChests');
		const mdValue = getValue('mediumChests');
		const lgValue = getValue('largeChests');
		const xlValue = getValue('extraLargeChests');
		
        // Determine the selected copy icon based on radio button state
        const isAlmostCopy = document.getElementById('almostCopy')?.checked;
        const selectedCopyIcon = isAlmostCopy ? 'copy2.png' : 'copy.png';

		
        // Helper function to manage display and text content
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
        // Check validity (copies must be <= copies2 if both > 0)
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
		    // chestFooter.style.justifyContent = 'center'; (Removed as it doesn't apply well to block elements)
        }
    }
});