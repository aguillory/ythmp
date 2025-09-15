import { state } from './state.js';

export function displayBoard(boardState, containerRef) {
    let boardContainer;

    if (typeof containerRef === 'string') {
        boardContainer = document.getElementById(containerRef);
    } else if (containerRef instanceof HTMLElement) {
        boardContainer = containerRef;
    }

    if (!boardContainer) return;

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
    if (tile.border && tile.border.toLowerCase() !== 'none') {
        tileDiv.classList.add(`border-${tile.border.toLowerCase()}`);
    }

    return tileDiv;
}

export function updateHeaderAndFooter() {
    const elements = state.elements.chestForm.elements;
    const getValue = (name) => parseInt(elements[name]?.value, 10) || 0;
    
    const copies = getValue('copies');
    const copies2 = getValue('copies2');
    const smValue = getValue('smallChests');
    const mdValue = getValue('mediumChests');
    const lgValue = getValue('largeChests');
    const xlValue = getValue('extraLargeChests');
    
    const isAlmostCopy = document.getElementById('almostCopy')?.checked;
    const selectedCopyIcon = isAlmostCopy ? 'copy2.png' : 'copy.png';

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

    // Update copies display
    const copyContainer = document.getElementById('copy');
    if (copyContainer) {
        if (copies > 0 && copies2 > 0 && copies <= copies2) {
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

    // Update chest displays
    updateDisplay(smValue, 'smtxt', 'sm');
    updateDisplay(mdValue, 'mdtxt', 'md');
    updateDisplay(lgValue, 'lgtxt', 'lg');
    updateDisplay(xlValue, 'xltxt', 'xl');
    
    // Show header and footer
    const chestHeader = document.getElementById('chestheader');
    if (chestHeader) {
        chestHeader.style.display = 'flex';
        chestHeader.style.justifyContent = 'center';
    }
    const chestFooter = document.getElementById('chestfooter');
    if (chestFooter) {
        chestFooter.style.display = 'block';
    }
}