document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    
    // Dynamically retrieve the generated tile size from CSS variables for accurate border positioning
    const tileSizeFromCSS = getComputedStyle(document.documentElement).getPropertyValue('--generated-tile-size');
    // Parse the value (removing 'px') and provide a fallback (42) if reading fails
    const generatedTilePixels = parseInt(tileSizeFromCSS, 10) || 42; 

    const CONFIG = {
        GRID_SIZE: 5,
        GENERATED_TILE_PIXELS: generatedTilePixels,
        TILE_OPTIONS: [
            { value: "X", text: "Unused" },
            { value: "one", text: "1" }, { value: "two", text: "2" },
            { value: "three", text: "3" }, { value: "four", text: "4" },
            { value: "five", text: "5" }, { value: "six", text: "6" },
            { value: "threex", text: "3x" }, { value: "fourx", text: "4x" },
            { value: "yahtzee", text: "Yahtzee" }, { value: "chance", text: "?" },
            { value: "pair", text: "2 Pair" }, { value: "odds", text: "Odds" },
            { value: "evens", text: "Evens" }, { value: "full", text: "Full House" },
            { value: "sm", text: "Sm Straight" }, { value: "lg", text: "Lg Straight" }
        ]
    };

    // --- DOM Elements & State ---
    const boardForm = document.getElementById('boardForm');
    const chestForm = document.getElementById('chestForm');
    const gridContainer = document.querySelector('.grid');
    
    // State for the border selection
    // selection stores the final coordinates { r1, c1, r2, c2 } (0-indexed, inclusive)
    let selection = null; 

    // NEW: State for interactive selection (drag and drop)
    let isSelecting = false;
    let startCoords = null; // { r, c }


    // --- Initialization ---
    initialize();

    function initialize() {
        generateGridInputs();
        setupEventListeners();
        // Initialize the visualization color based on the default selected radio button
        updateActiveColor(getSelectedColor());
    }

    // --- Grid Generation (Updated Layout and Features) ---

    function generateGridInputs() {
        if (!gridContainer) return;

        const totalTiles = CONFIG.GRID_SIZE * CONFIG.GRID_SIZE;
        const fragment = document.createDocumentFragment();

        for (let i = 1; i <= totalTiles; i++) {
            const index = i - 1;
            const row = Math.floor(index / CONFIG.GRID_SIZE);
            const col = index % CONFIG.GRID_SIZE;

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
            // Store coordinates for selection visualization lookup
            visualTile.dataset.row = row;
            visualTile.dataset.col = col;

            // Event listener for dynamic tile background update
            select.addEventListener('change', (event) => {
                updateVisualTileBackground(visualTile, event.target.value);
            });

            // NEW: Interactive selection listeners (Mouse)
            visualTile.addEventListener('mousedown', handleSelectionStart);
            visualTile.addEventListener('mouseenter', handleSelectionMove);
            
            // NEW: Interactive selection listeners (Touch - Start only, Move is handled on container)
            // { passive: false } is needed to allow preventDefault() to stop scrolling
            visualTile.addEventListener('touchstart', handleSelectionStart, { passive: false });
            
            
            // 3. Checkboxes (Helper function updated for visualization)
            const treasureCheckbox = createCheckbox(`treasure${i}`, ' Treasure?', visualTile, 'vis-treasure');
            const starCheckbox = createCheckbox(`star${i}`, ' Star?', visualTile, 'vis-star');


            // Append inputs
            tileContainer.appendChild(select);
            tileContainer.appendChild(visualTile);
            tileContainer.appendChild(treasureCheckbox);
            tileContainer.appendChild(starCheckbox);
            
            fragment.appendChild(tileContainer);
        }
        gridContainer.appendChild(fragment);
    }

    // Helper to create checkboxes and link them to visualization
    function createCheckbox(name, text, visualTile, visualizationClass) {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = name;
        
        checkbox.addEventListener('change', (event) => {
            // Toggle the visualization class based on the checked status
            visualTile.classList.toggle(visualizationClass, event.target.checked);
        });

        label.appendChild(checkbox);
        label.append(text);
        return label;
    };


    // Updates the background image of the visual tile by changing its class
    function updateVisualTileBackground(visualTile, newValue) {
        // Remove previous state classes
        CONFIG.TILE_OPTIONS.forEach(opt => {
            visualTile.classList.remove(opt.value.toLowerCase());
        });
        // Add the new state class
        visualTile.classList.add(newValue.toLowerCase());
    }

    // --- Event Listeners ---

    function setupEventListeners() {
        boardForm.addEventListener('submit', handleGenerate);
        document.getElementById('clearAllButton').addEventListener('click', handleClearAll);
        
        // Border controls listeners
        document.getElementById('clearBorders').addEventListener('click', clearSelection);

        // NEW: Color change listener
        document.querySelectorAll('input[name="borderColor"]').forEach(radio => {
            radio.addEventListener('change', () => updateActiveColor(getSelectedColor()));
        });

        // Global listeners to stop selection (Mouse and Touch)
        document.addEventListener('mouseup', handleSelectionEnd);
        document.addEventListener('touchend', handleSelectionEnd);

        // NEW: Touchmove listener on the grid container for mobile dragging
        gridContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    // --- Event Handlers ---

    function handleGenerate(event) {
        event.preventDefault(); 

        // 1. Get Data (includes tiles, border selection, and color)
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

        // Clear border selection
        clearSelection();

        // Reset visual tiles to default state ('X') and clear overlays
        const visualTiles = gridContainer.querySelectorAll('.tile-visual');
        const defaultValue = CONFIG.TILE_OPTIONS[0].value;
        visualTiles.forEach(tile => {
            updateVisualTileBackground(tile, defaultValue);
            // Manually clear visualization classes
            tile.classList.remove('vis-treasure');
            tile.classList.remove('vis-star');
        });

        // Ensure default radio buttons are checked after reset
        document.getElementById('exactCopy').checked = true;
        // boardForm.reset() handles the color radio reset (to the one marked 'checked' in HTML), 
        // but we must update the CSS variable manually to reflect the default color visualization.
        updateActiveColor(getSelectedColor());
    }

    // --- Interactive Selection Feature Logic (NEW) ---

    // Helper to get the currently selected color
    function getSelectedColor() {
        // Find the checked radio button, default to the first color if somehow none is found
        return document.querySelector('input[name="borderColor"]:checked')?.value || '#956230'; 
    }

    // Updates the CSS variable used for visualization (Efficient approach)
    function updateActiveColor(color) {
        document.documentElement.style.setProperty('--active-border-color', color);
    }

    // Helper to extract coordinates from a DOM element
    function getCoordsFromElement(element) {
        if (element && element.classList.contains('tile-visual') && element.dataset.row !== undefined && element.dataset.col !== undefined) {
            return {
                r: parseInt(element.dataset.row, 10),
                c: parseInt(element.dataset.col, 10)
            };
        }
        return null;
    }

    function handleSelectionStart(event) {
        // Prevent default behaviors like image dragging (mouse) or scrolling (touch)
        if (event.cancelable) {
             event.preventDefault(); 
        }

        // Determine the target element (handles both mouse and touch start)
        const targetElement = (event.touches) ? document.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY) : event.currentTarget;
        
        const coords = getCoordsFromElement(targetElement);
        if (coords) {
            isSelecting = true;
            startCoords = coords;
            // Immediately visualize the selection (starting as a 1x1)
            updateSelection(coords);
        }
    }

    // For mouse movement (relies on mouseenter event)
    function handleSelectionMove(event) {
        if (!isSelecting) return;
        
        const coords = getCoordsFromElement(event.currentTarget);
        if (coords) {
            updateSelection(coords);
        }
    }

    // For touch movement (mobile dragging)
    function handleTouchMove(event) {
        if (!isSelecting) return;
        // Prevent scrolling while dragging
        if (event.cancelable) {
            event.preventDefault();
        }

        const touch = event.touches[0];
        // Find the element currently under the touch point
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        
        const coords = getCoordsFromElement(targetElement);
        if (coords) {
            updateSelection(coords);
        }
    }

    function handleSelectionEnd() {
        // Stop the selection process.
        isSelecting = false;
        startCoords = null;
    }

    // Calculates the rectangle based on start and current coordinates and updates the state/visualization
    function updateSelection(currentCoords) {
        if (!startCoords || !currentCoords) return;

        // Calculate the rectangle, ensuring r1/c1 is top-left and r2/c2 is bottom-right
        // This enforces only squares or rectangles.
        const rect = {
            r1: Math.min(startCoords.r, currentCoords.r),
            c1: Math.min(startCoords.c, currentCoords.c),
            r2: Math.max(startCoords.r, currentCoords.r),
            c2: Math.max(startCoords.c, currentCoords.c)
        };

        // Optimization: Check if the selection has actually changed before updating
        if (!selection || selection.r1 !== rect.r1 || selection.c1 !== rect.c1 || selection.r2 !== rect.r2 || selection.c2 !== rect.c2) {
            selection = rect;
            visualizeSelection(rect);
        }
    }

    
    // Updates the visualization on the input grid
    function visualizeSelection(rect) {
        const visualTiles = gridContainer.querySelectorAll('.tile-visual');
        visualTiles.forEach(tile => {
            if (!rect) {
                tile.classList.remove('selected');
                return;
            }

            const r = parseInt(tile.dataset.row, 10);
            const c = parseInt(tile.dataset.col, 10);

            // Check if the tile is within the rectangle boundaries
            if (r >= rect.r1 && r <= rect.r2 && c >= rect.c1 && c <= rect.c2) {
                tile.classList.add('selected');
            } else {
                tile.classList.remove('selected');
            }
        });
    }

    function clearSelection() {
        selection = null;
        visualizeSelection(null);
    }

    // --- Data Processing Functions ---

    // Extract data from the input grid (Updated to include color)
    function getBoardData() {
        const tilesData = [];
        // We use FormData to get the tile states AND the selected border color (radio buttons).
        const formData = new FormData(boardForm);

        for (let i = 1; i <= CONFIG.GRID_SIZE * CONFIG.GRID_SIZE; i++) {
            const state = formData.get(`tileState${i}`);
            const treasure = formData.get(`treasure${i}`) === 'on';
            const star = formData.get(`star${i}`) === 'on';

            tilesData.push({
                state: state,
                treasure: treasure,
                star: star
            });
        }
        
        // Process border data
        let borderData = null;
        if (selection) {
            // Get the color from the form data (the currently selected radio button)
            const color = formData.get('borderColor');
            borderData = {
                ...selection, // r1, c1, r2, c2
                color: color
            };
        }

        // Return the complete state
        return {
            tiles: convertTo2DArray(tilesData),
            border: borderData
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

    // Rotate the board state 90 degrees clockwise (Handles tiles, border coordinates, and color)
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

        // 2. Rotate Border Coordinates
        let newBorder = null;
        if (boardState.border) {
            // Extract coordinates AND color
            const { r1, c1, r2, c2, color } = boardState.border;
            
            // Logic derived from coordinate transformation (R, C) -> (C, N-1-R)
            
            // Calculate the transformed coordinates
            const transformedR1 = c1;
            const transformedC1 = N - 1 - r1;
            
            const transformedR2 = c2;
            const transformedC2 = N - 1 - r2;

            // Determine the new rectangle boundaries
            const newR1 = Math.min(transformedR1, transformedR2);
            const newR2 = Math.max(transformedR1, transformedR2);
            const newC1 = Math.min(transformedC1, transformedC2);
            const newC2 = Math.max(transformedC1, transformedC2);

            // Reassemble the border object, preserving the color
            newBorder = { r1: newR1, c1: newC1, r2: newR2, c2: newC2, color: color };
        }

        return {
            tiles: newTiles,
            border: newBorder
        };
    }

    // --- Rendering Functions (Updated for Dynamic Color) ---

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

                fragment.appendChild(tileDiv);
            });
        });

        // 2. Render Border Overlay using Absolute Positioning
        if (boardState.border) {
            const borderDiv = document.createElement('div');
            borderDiv.className = 'generated-border-overlay';

            // Extract coordinates and color
            const { r1, c1, r2, c2, color } = boardState.border;
            const TILE_SIZE = CONFIG.GENERATED_TILE_PIXELS;

            // Calculate position and dimensions in pixels
            const top = r1 * TILE_SIZE;
            const left = c1 * TILE_SIZE;
            const width = (c2 - c1 + 1) * TILE_SIZE;
            const height = (r2 - r1 + 1) * TILE_SIZE;

            // Apply styles
            borderDiv.style.top = `${top}px`;
            borderDiv.style.left = `${left}px`;
            borderDiv.style.width = `${width}px`;
            borderDiv.style.height = `${height}px`;
            // NEW: Apply the dynamic color
            borderDiv.style.borderColor = color;

            fragment.appendChild(borderDiv);
        }

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