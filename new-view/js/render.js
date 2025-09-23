// js/render.js

const GRID_SIZE = 5;

// --- Data Processing Utilities ---

function convertFlatTo2D(flatArray) {
    if (!flatArray || flatArray.length !== GRID_SIZE * GRID_SIZE) {
        console.error("Invalid flat tile data received.");
        return [];
    }
    const board2D = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        board2D.push(flatArray.slice(i * GRID_SIZE, (i + 1) * GRID_SIZE));
    }
    return board2D;
}

function rotateBoardState(boardState) {
    if (!boardState || !boardState.tiles || boardState.tiles.length === 0) return boardState;

    const originalTiles = boardState.tiles;
    const newTiles = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            // 90 deg Clockwise rotation: (r, c) -> (c, N-1-r)
            newTiles[c][(GRID_SIZE - 1) - r] = { ...originalTiles[r][c] };
        }
    }

    return {
        ...boardState,
        tiles: newTiles
    };
}

// --- Rendering Functions ---

function displayBoard(boardState, boardContainer) {
    if (!boardContainer || !boardState || !boardState.tiles) return;

    boardContainer.innerHTML = '';
    boardContainer.className = 'generatedBoard';

    const fragment = document.createDocumentFragment();

    boardState.tiles.forEach((row) => {
        row.forEach((tile) => {
            const tileDiv = createTileElement(tile);
            fragment.appendChild(tileDiv);
        });
    });

    boardContainer.appendChild(fragment);
}

function createTileElement(tile) {
    const tileDiv = document.createElement('div');
    const tileStateClass = (tile && tile.type) ? tile.type.toLowerCase() : 'blank';
    tileDiv.className = `generatedTile tile-bg ${tileStateClass}`;

    if (tile) {
        if (tile.hasTreasure) {
            tileDiv.classList.add('treasureGenerated');
        }
        if (tile.hasStar) {
            tileDiv.classList.add('starGenerated');
        }
        if (tile.hasBulb) {
            tileDiv.classList.add('bulbGenerated');
        }
        if (tile.border && tile.border.toLowerCase() !== 'none') {
            tileDiv.classList.add(`border-${tile.border.toLowerCase()}`);
        }
    }

    return tileDiv;
}


// --- Map Wrapper Creation ---

export function createMapWrapper(mapId, mapData) {
    const wrapper = document.createElement('div');
    // Use 'map-wrapper' for the original, non-card look
    wrapper.className = 'map-wrapper';

    // --- Chest/Copy Header ---
    const d = mapData.mapData;
    if (!d) {
        wrapper.appendChild(document.createTextNode('Error loading map data structure.'));
        return wrapper;
    }

    const chestHeader = document.createElement('div');
    chestHeader.className = 'chest-header-display';

    // "Copy" element
    const copies = d.numberOf || 0;
    const copies2 = d.outOf || 0;
    if (copies > 0 && copies2 > 0 && copies <= copies2) {
        const copyContainer = document.createElement('div');
        copyContainer.className = 'copies-container';
        const isAlmostCopy = d.isAlmostCopy || false;
        const selectedCopyIcon = isAlmostCopy ? 'copy2.png' : 'copy.png';
        
        const copyIcon = document.createElement('img');
        copyIcon.src = selectedCopyIcon;
        copyIcon.alt = 'Copies';
        copyIcon.className = 'chestsimg';
        
        const copyTxt = document.createElement('span');
        copyTxt.className = 'copies-text';
        copyTxt.textContent = `${copies} of ${copies2}`;
        
        copyContainer.appendChild(copyIcon);
        copyContainer.appendChild(copyTxt);
        chestHeader.appendChild(copyContainer);
    }

    // Helper to create chest elements
    const createChestElement = (value, imgSrc, altText) => {
        if (value <= 0) return null;
        const container = document.createElement('div');
        container.className = 'chest-container';
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = altText;
        img.className = 'chestsimg';
        const text = document.createElement('span');
        text.textContent = value;
        text.className = 'chests'; // FIX: Apply the required styling class
        container.appendChild(img);
        container.appendChild(text);
        return container;
    };

    // Add chest elements
    const chests = [
        createChestElement(d.sm || 0, 'chests1.png', 'Small Chest'),
        createChestElement(d.md || 0, 'chests2.png', 'Medium Chest'),
        createChestElement(d.lg || 0, 'chests3.png', 'Large Chest'),
        createChestElement(d.xl || 0, 'chests4.png', 'Extra Large Chest')
    ];
    
    chests.forEach(el => {
        if (el) chestHeader.appendChild(el);
    });

    wrapper.appendChild(chestHeader);

    // --- Map Content (The 4 boards) ---
    
    // Prepare the 4 rotations
    const boardState = {
        tiles: convertFlatTo2D(d.tiles)
    };

    if (boardState.tiles.length === 0) {
        wrapper.appendChild(document.createTextNode('Error rendering map tiles.'));
        return wrapper;
    }

    // Calculate rotations sequentially (Clockwise)
    const rotate90 = rotateBoardState(boardState);
    const rotate180 = rotateBoardState(rotate90);
    const rotate270 = rotateBoardState(rotate180);

    // Create the 'window' structure
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

    // Display the boards (Order matches the builder tool)
    displayBoard(boardState, boardTL); // 0 degrees
    displayBoard(rotate270, boardTR);  // 270 degrees clockwise
    displayBoard(rotate180, boardBR);  // 180 degrees
    displayBoard(rotate90, boardBL);   // 90 degrees clockwise

    wrapper.appendChild(windowClone);

    // --- Notes Section (Custom + Default) ---
    const notesSection = document.createElement('div');
    notesSection.className = 'map-notes';

    // Add custom notes if they exist (Requires Quill CSS)
    if (mapData.notesHtml && mapData.notesHtml.trim() !== '') {
        const customNotesContainer = document.createElement('div');
        customNotesContainer.className = 'ql-snow';
        customNotesContainer.innerHTML = `<div class="ql-editor">${mapData.notesHtml}</div>`;
        notesSection.appendChild(customNotesContainer);
    }

    // Add default notes
    const defaultNote1 = document.createElement('div');
    defaultNote1.className = 'map-default-note-1';
    defaultNote1.textContent = 'Green spots have treasure chests.';

    const defaultNote2 = document.createElement('div');
    defaultNote2.className = 'map-default-note-2';
    defaultNote2.textContent = 'Brown spots don\'t have treasure chests.';

    notesSection.appendChild(defaultNote1);
    notesSection.appendChild(defaultNote2);

    wrapper.appendChild(notesSection);

     return wrapper;
}