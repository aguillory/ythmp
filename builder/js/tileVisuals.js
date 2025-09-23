import { CONFIG } from './config.js';

export function updateVisualTileBackground(visualTile, newValue) {
    CONFIG.TILE_OPTIONS.forEach(opt => {
        visualTile.classList.remove(opt.value.toLowerCase());
    });
    visualTile.classList.add(newValue.toLowerCase());
}

export function updateVisualTileBorder(visualTile, newBorderValue) {
    CONFIG.BORDER_OPTIONS.forEach(opt => {
        visualTile.classList.remove(`border-${opt.value.toLowerCase()}`);
    });
    if (newBorderValue !== 'none') {
        visualTile.classList.add(`border-${newBorderValue.toLowerCase()}`);
    }
}