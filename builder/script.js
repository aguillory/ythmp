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
            { value: "red", text: "Red" }
        ]
    };

    // --- DOM Elements & State ---
    const boardForm = document.getElementById('boardForm');
    const chestForm = document.getElementById('chestForm');
    const gridContainer = document.querySelector('.grid');
    
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
    }

    // --- Event Handlers ---

    function handleGenerate(event) {
        event.preventDefault(); 

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
    }

    // Client-side clear without page reload
    function handleClearAll() {
        // Reset forms
        boardForm.reset();
        chestForm.reset();

        // Clear outputs
        ['boardTL', 'boardTR', 'boardBR', 'boardBL'].forEach(id => {
            const element = document.getElementById(id);
            element.innerHTML = '';
            element.className = '';
        });
        document.getElementById('chestheader').style.display = 'none';
        document.getElementById('chestfooter').style.display = 'none';

        // Clear border selection logic removed.

        // Reset visual tiles to default state ('blank') and clear overlays
        const visualTiles = gridContainer.querySelectorAll('.tile-visual');
        const defaultValue = CONFIG.TILE_OPTIONS[0].value;
        const defaultBorder = CONFIG.BORDER_OPTIONS[0].value; // New Feature

        visualTiles.forEach(tile => {
            updateVisualTileBackground(tile, defaultValue);
            // Manually clear visualization classes
            tile.classList.remove('vis-treasure');
            tile.classList.remove('vis-star');
            tile.classList.remove('vis-bulb'); // Added bulb
            
            // New Feature: Clear custom borders
            updateVisualTileBorder(tile, defaultBorder);
        });

        // New Feature: Reset border icon appearance
        const borderIcons = gridContainer.querySelectorAll('.icon-select-label');
        borderIcons.forEach(icon => {
            icon.classList.remove('is-active');
        });

        // Ensure default radio buttons are checked after reset
        document.getElementById('exactCopy').checked = true;
        // Border color visualization update removed.
    }

    // --- Interactive Selection Feature Logic Removed ---
    // (All functions like getCoordsFromElement, handleSelectionStart, etc., removed)


    // --- Data Processing Functions ---

    // Extract data from the input grid
    function getBoardData() {
        const tilesData = [];
        // We use FormData to get the tile states.
        const formData = new FormData(boardForm);

        for (let i = 1; i <= CONFIG.GRID_SIZE * CONFIG.GRID_SIZE; i++) {
            const state = formData.get(`tileState${i}`);
            const treasure = formData.get(`treasure${i}`) === 'on';
            const star = formData.get(`star${i}`) === 'on';
            const bulb = formData.get(`bulb${i}`) === 'on'; // Added bulb
            const border = formData.get(`border${i}`); // New Feature: Capture border data

            tilesData.push({
                state: state,
                treasure: treasure,
                star: star,
                bulb: bulb, // Added bulb
                border: border // New Feature: Add border to tile data
            });
        }
        
        // Process border data removed.

        // Return the complete state
        return {
            tiles: convertTo2DArray(tilesData),
            // border removed
        };
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
    // Logic remains the same as it rotates the entire tile object (including the new border property)
    function rotateBoardState(boardState) {
        const size = CONFIG.GRID_SIZE;
        const N = size; // Alias for clarity in coordinate formulas

        // 1. Rotate Tiles (Standard matrix rotation)
        const oldTiles = boardState.tiles;
        let newTiles = Array.from({ length: size }, () => []);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                // Rotation logic: newTiles[i][j] = oldTiles[N - 1 - j][i]
                newTiles[i][j] = oldTiles[N - 1 - j][i];
            }
        }

        // 2. Rotate Border Coordinates removed.

        return {
            tiles: newTiles,
            // border removed
        };
    }

    // --- Rendering Functions ---

    function displayBoard(boardState, containerId) {
        const boardContainer = document.getElementById(containerId);
        boardContainer.innerHTML = ''; 
        boardContainer.className = 'generatedBoard';

        const fragment = document.createDocumentFragment();

        // 1. Render Tiles
        boardState.tiles.forEach((row) => {
            row.forEach((tile) => {
                const tileDiv = document.createElement('div');
                // Use tile-bg class here as well
                tileDiv.className = `generatedTile tile-bg ${tile.state.toLowerCase()}`;

                if (tile.treasure) {
                    tileDiv.classList.add('treasureGenerated'); 
                }
                if (tile.star) {
                    tileDiv.classList.add('starGenerated');
                }
                if (tile.bulb) { // Added bulb
                    tileDiv.classList.add('bulbGenerated');
                }

                // New Feature: Apply custom border
                if (tile.border && tile.border !== 'none') {
                    tileDiv.classList.add(`border-${tile.border.toLowerCase()}`);
                }

                fragment.appendChild(tileDiv);
            });
        });

        // 2. Render Border Overlay removed.

        boardContainer.appendChild(fragment);
    }

    // (updateHeaderAndFooter remains the same)
    function updateHeaderAndFooter() {
        // Use FormData to easily extract chest form values
        const formData = new FormData(chestForm);
        
        // Parse values, default to 0 if not present or invalid
        const copies = parseInt(formData.get('copies'), 10) || 0;
		const copies2 = parseInt(formData.get('copies2'), 10) || 0;
		const smValue = parseInt(formData.get('smallChests'), 10) || 0;
		const mdValue = parseInt(formData.get('mediumChests'), 10) || 0;
		const lgValue = parseInt(formData.get('largeChests'), 10) || 0;
		const xlValue = parseInt(formData.get('extraLargeChests'), 10) || 0;
		const selectedCopyIcon = formData.get('copyType');
		
        // Helper function to manage display and text content
        const updateDisplay = (value, txtId, containerId) => {
            const container = document.getElementById(containerId);
            if (value > 0) {
                document.getElementById(txtId).textContent = value;
                container.style.display = 'flex';
            } else {
                container.style.display = 'none';
            }
        };

        // Copies Logic
        const copyContainer = document.getElementById('copy');
		if (copies > 0 && copies2 > 0 && copies <= copies2 && selectedCopyIcon){
			document.getElementById('copytxt').textContent = copies;
			document.getElementById('copy2txt').textContent = copies2;
			document.getElementById('copyIcon').src = selectedCopyIcon;
			copyContainer.style.display = 'flex';
		} else {
            copyContainer.style.display = 'none';
        }

        // Chests Logic
        updateDisplay(smValue, 'smtxt', 'sm');
        updateDisplay(mdValue, 'mdtxt', 'md');
        updateDisplay(lgValue, 'lgtxt', 'lg');
        updateDisplay(xlValue, 'xltxt', 'xl');
		
        // Set overall visibility
		document.getElementById('chestheader').style.display = 'flex';
		document.getElementById('chestheader').style.justifyContent = 'center';
		document.getElementById('chestfooter').style.display = 'block';
		document.getElementById('chestfooter').style.justifyContent = 'center';
    }
});