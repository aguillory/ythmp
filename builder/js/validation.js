import { CONFIG } from './config.js';
import { state } from './state.js';

/**
 * Checks if a single tile is invalid based on its state, treasure, and extras.
 * @param {number} index - The tile index (1-25).
 * @returns {{isInvalid: boolean, message: string | null}}
 */
function getTileInvalidState(index) {
    const elements = state.elements.boardForm.elements;
    const stateEl = elements[`tileState${index}`];
    const treasureEl = elements[`treasure${index}`];
    const starEl = elements[`star${index}`];
    const bulbEl = elements[`bulb${index}`];
    const borderEl = elements[`border${index}`];

    if (!stateEl || !treasureEl || !starEl || !bulbEl || !borderEl) {
        return { isInvalid: false, message: null };
    }

    const hasExtras = starEl.checked || bulbEl.checked || (borderEl.value !== 'none');
    const hasTreasure = treasureEl.checked;
    const isBlank = stateEl.value === 'blank';

    // Rule 1: No extras on 'blank' tiles.
    if (isBlank && hasExtras) {
        return { 
            isInvalid: true, 
            message: `Tile ${index}: Cannot have stars, bulbs, or borders on a 'blank' tile.` 
        };
    }
    
    // Rule 2: Extras are only allowed on tiles with treasure.
    if (hasExtras && !hasTreasure) {
        return { 
            isInvalid: true, 
            message: `Tile ${index}: Stars, bulbs, or borders are only allowed on tiles with treasure.` 
        };
    }

    return { isInvalid: false, message: null };
}

/**
 * Checks a single tile, updates its UI style, and returns its error state.
 * @param {number} index - The tile index (1-25).
 */
export function validateAndStyleTile(index) {
    const visualTile = document.getElementById(`visualTile${index}`);
    if (!visualTile) return;
    
    const container = visualTile.closest('.tile-input-container');
    if (!container) return;
    
    const { isInvalid } = getTileInvalidState(index);
    container.classList.toggle('error', isInvalid);
}

/**
 * Checks ALL tiles for generation.
 * Styles all tiles and returns the first error message found, or null.
 * @returns {string | null} - The first error message, or null if valid.
 */
export function validateAllTilesForGeneration() {
    const totalTiles = CONFIG.GRID_SIZE * CONFIG.GRID_SIZE;
    let firstErrorMessage = null;

    for (let i = 1; i <= totalTiles; i++) {
        const visualTile = document.getElementById(`visualTile${i}`);
        const container = visualTile ? visualTile.closest('.tile-input-container') : null;
        if (!container) continue;

        const { isInvalid, message } = getTileInvalidState(i);

        // Style the tile
        container.classList.toggle('error', isInvalid);

        // Store the first error
        if (isInvalid && !firstErrorMessage) {
            firstErrorMessage = message;
        }
    }
    return firstErrorMessage; // null if no errors
}