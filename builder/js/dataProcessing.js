import { CONFIG } from './config.js';
import { state } from './state.js';
import { formatBorderOutput } from './utils.js';

export function getBoardData() {
    const tilesData = getFlatTileData();
    return {
        tiles: convertTo2DArray(tilesData)
    };
}

export function getFlatTileData() {
    const tilesData = [];
    const elements = state.elements.boardForm.elements;

    for (let i = 1; i <= CONFIG.GRID_SIZE * CONFIG.GRID_SIZE; i++) {
        const stateEl = elements[`tileState${i}`];
        const treasureEl = elements[`treasure${i}`];
        const starEl = elements[`star${i}`];
        const bulbEl = elements[`bulb${i}`];
        const borderEl = elements[`border${i}`];

        const tile = {
            state: stateEl ? stateEl.value : CONFIG.TILE_OPTIONS[0].value,
            treasure: treasureEl ? treasureEl.checked : false,
            star: starEl ? starEl.checked : false,
            bulb: bulbEl ? bulbEl.checked : false,
            border: borderEl ? borderEl.value : CONFIG.BORDER_OPTIONS[0].value
        };

        tilesData.push(tile);
    }
    return tilesData;
}

export function convertTo2DArray(data) {
    const size = CONFIG.GRID_SIZE;
    let boardTiles = [];
    for (let i = 0; i < size; i++) {
        boardTiles.push(data.slice(i * size, (i + 1) * size));
    }
    return boardTiles;
}

export function convertFlatTo2D(flatTiles) {
    const size = CONFIG.GRID_SIZE;
    let boardTiles = [];
    for (let i = 0; i < size; i++) {
        const row = flatTiles.slice(i * size, (i + 1) * size).map(tileData => ({
            state: tileData.type,
            treasure: tileData.hasTreasure,
            star: tileData.hasStar,
            bulb: tileData.hasBulb,
            border: tileData.border.toLowerCase()
        }));
        boardTiles.push(row);
    }
    return boardTiles;
}

export function rotateBoardState(boardState) {
    const size = CONFIG.GRID_SIZE;
    const N = size;
    const oldTiles = boardState.tiles;
    let newTiles = Array.from({ length: size }, () => Array(size).fill(null));

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            newTiles[i][j] = { ...oldTiles[N - 1 - j][i] };
        }
    }

    return { tiles: newTiles };
}

export function generateBoardCodeObject() {
    const chestElements = state.elements.chestForm.elements;
    const flatTileData = getFlatTileData();

    const isAlmostCopy = document.getElementById('almostCopy')?.checked || false;

    const formattedTiles = flatTileData.map(tile => ({
        hasTreasure: tile.treasure,
        hasStar: tile.star,
        hasBulb: tile.bulb,
        border: formatBorderOutput(tile.border),
        type: tile.state 
    }));

    const getChestValue = (name) => parseInt(chestElements[name]?.value, 10) || 0;

    return {
        isAlmostCopy: isAlmostCopy,
        numberOf: getChestValue('copies'),
        outOf: getChestValue('copies2'),
        sm: getChestValue('smallChests'),
        md: getChestValue('mediumChests'),
        lg: getChestValue('largeChests'),
        xl: getChestValue('extraLargeChests'),
        tiles: formattedTiles
    };
}


/**
 * NEW: Generates a normalized string for a map state for duplicate checking.
 * @param {Array<Array<Object>>} tiles - The 2D array of tile objects.
 * @returns {string} A semicolon-separated string of all tile properties.
 */
export function getNormalizedMapString(tiles) {
    // tiles is expected to be a 2D array [row][col]
    return tiles.map(row => 
        row.map(tile => {
            // Check for treasure status
            const t = tile.treasure ? 't' : 'f';
            
            // Use tile.state (from getBoardData) or tile.type (from mapData)
            const type = tile.state || tile.type || 'blank'; 
            
            // Return only the type and treasure status
            return `${type},${t}`;
        }).join(';')
    ).join(';');
}