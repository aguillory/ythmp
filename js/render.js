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
    const size = 5; // Or GRID_SIZE if you have it defined
    const N = size;
    const oldTiles = boardState.tiles;
    let newTiles = Array.from({ length: size }, () => Array(size).fill(null));

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            newTiles[i][j] = { ...oldTiles[N - 1 - j][i] };
        }
    }

    return { ...boardState, tiles: newTiles };
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
    const card = document.createElement('div');
    card.className = 'map-card';

    // --- Chest/Copy Header ---
    const d = mapData.mapData;
    if (!d) {
        card.appendChild(document.createTextNode('Error loading map data structure.'));
        return card;
    }
    const chestHeaderClone = document.createElement('div');
    chestHeaderClone.style.display = 'flex';
    chestHeaderClone.style.justifyContent = 'center';
    chestHeaderClone.style.gap = '10px';
    chestHeaderClone.style.flexWrap = 'wrap';
    chestHeaderClone.style.marginBottom = '15px'; // Add some spacing
    const copies = d.numberOf || 0;
    const copies2 = d.outOf || 0;
    if (copies > 0 && copies2 > 0 && copies <= copies2) {
        const copyContainer = document.createElement('div');
        copyContainer.className = 'copies-container';
        copyContainer.style.display = 'flex';
        copyContainer.style.alignItems = 'center';
        copyContainer.style.borderRight = '2px solid #000';
        copyContainer.style.paddingRight = '10px';

        const copyIcon = document.createElement('img');
        const isAlmostCopy = d.isAlmostCopy || false;
        copyIcon.src = isAlmostCopy ? 'copy2.png' : 'copy.png';
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

    const smEl = createChestElement(d.sm, 'chests1.png', 'Small Chest');
    const mdEl = createChestElement(d.md, 'chests2.png', 'Medium Chest');
    const lgEl = createChestElement(d.lg, 'chests3.png', 'Large Chest');
    const xlEl = createChestElement(d.xl, 'chests4.png', 'Extra Large Chest');

    if (smEl) chestHeaderClone.appendChild(smEl);
    if (mdEl) chestHeaderClone.appendChild(mdEl);
    if (lgEl) chestHeaderClone.appendChild(lgEl);
    if (xlEl) chestHeaderClone.appendChild(xlEl);
    card.appendChild(chestHeaderClone);


    // --- Map Content (The 4 boards) ---
    const content = document.createElement('div');
    content.className = 'map-card-content';
    
    const boardState = {
        tiles: convertFlatTo2D(d.tiles)
    };

    if (boardState.tiles.length === 0) {
        card.appendChild(document.createTextNode('Error rendering map tiles.'));
        return card;
    }

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

    if (mapData.notesHtml && mapData.notesHtml.trim() !== '') {
        const customNotesContainer = document.createElement('div');
        customNotesContainer.className = 'ql-snow';
        customNotesContainer.innerHTML = `<div class="ql-editor">${mapData.notesHtml}</div>`;
        notesSection.appendChild(customNotesContainer);
    }

    const defaultNote1 = document.createElement('div');
    defaultNote1.className = 'map-card-default-note-1';
    defaultNote1.textContent = 'Green spots have treasure chests.';

    const defaultNote2 = document.createElement('div');
    defaultNote2.className = 'map-card-default-note-2';
    defaultNote2.textContent = 'Brown spots don\'t have treasure chests.';

    notesSection.appendChild(defaultNote1);
    notesSection.appendChild(defaultNote2);

    card.appendChild(notesSection);

    // --- Map ID Footer ---
    const footer = document.createElement('div');
    footer.className = 'map-card-footer';
    footer.style.textAlign = 'center';
    footer.style.paddingTop = '10px';
    footer.style.marginTop = '10px';
    footer.style.borderTop = '1px solid #ccc';
    footer.textContent = `Map ID: ${mapId}`;
    card.appendChild(footer);

    return card;
}