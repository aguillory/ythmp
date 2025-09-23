import { getNormalizedMapString, convertFlatTo2D, rotateBoardState } from './dataProcessing.js';
import { fetchMapsBySignature } from './database.js';

/**
 * Checks if a given mapData object is a duplicate of an existing map
 * in the database with the same chest signature.
 * Compares all 4 rotations.
 * @param {object} mapData - The mapData object (from generateBoardCodeObject).
 * @param {string | null} mapIdToExclude - The ID of the map to exclude (e.g., when updating).
 * @returns {Promise<{isDuplicate: boolean, mapId: string | null}>}
 */
export async function checkMapForDuplicates(mapData, mapIdToExclude) {
    console.log("Checking for duplicates...");

    // 1. Generate 4 rotations for the new map
    const newMapStrings = new Set();
    let currentBoardState = { tiles: convertFlatTo2D(mapData.tiles) };
    
    for (let i = 0; i < 4; i++) {
        const normString = getNormalizedMapString(currentBoardState.tiles);
        newMapStrings.add(normString);
        currentBoardState = rotateBoardState(currentBoardState);
    }

    // 2. Get chest signature
    const countSm = mapData.sm || 0;
    const countMd = mapData.md || 0;
    const countLg = mapData.lg || 0;
    const countXl = mapData.xl || 0;
    const chestSignature = `${countSm}.${countMd}.${countLg}.${countXl}`;

    // 3. Fetch all maps with the same signature
    const existingMaps = await fetchMapsBySignature(chestSignature);
    
    // 4. Generate all 4 rotation strings for ALL existing maps
    const existingMapStrings = new Map(); // Map<string, string> to store normString -> mapId

    for (const map of existingMaps) {
        // Skip the map we're currently editing
        if (map.id === mapIdToExclude) {
            continue;
        }

        let existingBoardState = { tiles: convertFlatTo2D(map.data.mapData.tiles) };
        for (let i = 0; i < 4; i++) {
            const normString = getNormalizedMapString(existingBoardState.tiles);
            if (!existingMapStrings.has(normString)) {
                existingMapStrings.set(normString, map.id);
            }
            existingBoardState = rotateBoardState(existingBoardState);
        }
    }
    
    // 5. Compare
    for (const newString of newMapStrings) {
        if (existingMapStrings.has(newString)) {
            const duplicateMapId = existingMapStrings.get(newString);
            console.warn(`Duplicate found! Matches map ID: ${duplicateMapId}`);
            return { isDuplicate: true, mapId: duplicateMapId };
        }
    }

    console.log("No duplicates found.");
    return { isDuplicate: false, mapId: null };
}