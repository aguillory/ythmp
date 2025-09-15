import { CONFIG } from './config.js';
import { state } from './state.js';
import { updateVisualTileBackground, updateVisualTileBorder } from './tileVisuals.js';

export function generateGridInputs() {
    const gridContainer = state.elements.gridContainer;
    if (!gridContainer || gridContainer.children.length > 0) return;

    const totalTiles = CONFIG.GRID_SIZE * CONFIG.GRID_SIZE;
    const fragment = document.createDocumentFragment();

    for (let i = 1; i <= totalTiles; i++) {
        const tileContainer = createTileContainer(i);
        fragment.appendChild(tileContainer);
    }
    
    gridContainer.appendChild(fragment);
}

function createTileContainer(index) {
    const container = document.createElement('div');
    container.className = 'tile-input-container';
    
    // Create dropdown
    const select = createTileSelect(index);
    
    // Create visual tile
    const visualTile = createVisualTile(index, select);
    
    // Create checkboxes and border selector
    const checkboxContainer = createCheckboxContainer(index, visualTile);
    
    container.appendChild(select);
    container.appendChild(visualTile);
    container.appendChild(checkboxContainer);
    
    return container;
}

function createTileSelect(index) {
    const select = document.createElement('select');
    select.name = `tileState${index}`;
    
    CONFIG.TILE_OPTIONS.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        select.appendChild(option);
    });
    
    return select;
}

function createVisualTile(index, select) {
    const visualTile = document.createElement('div');
    const initialValue = CONFIG.TILE_OPTIONS[0].value.toLowerCase();
    visualTile.id = `visualTile${index}`; 
    visualTile.className = `tile-visual tile-bg ${initialValue}`;
    
    select.addEventListener('change', (event) => {
        updateVisualTileBackground(visualTile, event.target.value);
    });
    
    return visualTile;
}

function createCheckboxContainer(index, visualTile) {
    const container = document.createElement('div');
    container.className = 'input-checkbox-container';
    
    container.appendChild(createIconCheckbox(`treasure${index}`, 'treasure.png', 'Treasure', visualTile, 'vis-treasure'));
    container.appendChild(createIconCheckbox(`star${index}`, 'star.png', 'Star', visualTile, 'vis-star'));
    container.appendChild(createIconCheckbox(`bulb${index}`, 'bulb.png', 'Bulb', visualTile, 'vis-bulb'));
    container.appendChild(createBorderSelector(`border${index}`, visualTile));
    
    return container;
}

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
}

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