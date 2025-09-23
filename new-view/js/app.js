// js/app.js

import { fetchMapsBySignaturePublic } from './database_public.js';
import { createMapWrapper } from './render.js';

document.addEventListener('DOMContentLoaded', function() {
    // Configuration ranges matching the original script.js
    const chestConfigs = {
        smallChests: { min: 0, max: 11 },
        mediumChests: { min: 0, max: 9 },
        largeChests: { min: 0, max: 7 },
        extraLargeChests: { min: 0, max: 5 },
        columnSelector: { min: 1, max: 4 }
    };

    const columnSelector = document.getElementById('columnSelector');
    const mapsDisplay = document.getElementById('mapsDisplay');
    // We target the container for applying column classes, matching the original behavior
    const mapContainer = document.getElementById('map-container');

    // --- Initialization ---

    // Populate select elements
    Object.keys(chestConfigs).forEach(selectId => {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) return;
        const config = chestConfigs[selectId];

        selectElement.innerHTML = '';

        for (let i = config.min; i <= config.max; i++) {
            let text = i;
            // Original text format for column selector
            if (selectId === 'columnSelector') {
                text = `${i} Column${i > 1 ? 's' : ''}`;
            }
            let option = new Option(text, i);
            selectElement.add(option);
        }
    });

    // Set initial layout (Original default was 1 column)
    if (columnSelector) columnSelector.value = "1";
    if (mapContainer) mapContainer.className = 'columns-1';

    // --- Event Handlers ---

    // Function to handle increment and decrement
    function updateSelectValue(selectElement, increment) {
        const config = chestConfigs[selectElement.id];
        if (!config) return;
        let currentValue = parseInt(selectElement.value);
        if (isNaN(currentValue)) {
            currentValue = config.min;
        }
        let newValue = currentValue + increment;

        if (newValue >= config.min && newValue <= config.max) {
            selectElement.value = newValue;
            // Trigger change event for column updates
            selectElement.dispatchEvent(new Event('change'));
        }
    }

    // Attach listeners for increment/decrement buttons
    document.querySelectorAll('.increment').forEach(function(button) {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            let selectElement = document.getElementById(targetId);
            
            if (selectElement && selectElement.tagName === 'SELECT') {
                updateSelectValue(selectElement, 1);
            }
        });
    });

    document.querySelectorAll('.decrement').forEach(function(button) {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            let selectElement = document.getElementById(targetId);

            if (selectElement && selectElement.tagName === 'SELECT') {
                updateSelectValue(selectElement, -1);
            }
        });
    });

    // Update column display (CRITICAL: Target mapContainer)
    if (columnSelector && mapContainer) {
        columnSelector.addEventListener('change', function() {
            let columns = this.value;
            // Remove existing classes
            mapContainer.classList.remove('columns-1', 'columns-2', 'columns-3', 'columns-4');
            // Add the new class
            mapContainer.classList.add(`columns-${columns}`);
        });
    }

    // --- Form Submission ---

    document.getElementById('chestForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const showMapsButton = document.getElementById('showMapsButton');

        const sm = document.getElementById('smallChests').value || 0;
        const md = document.getElementById('mediumChests').value || 0;
        const lg = document.getElementById('largeChests').value || 0;
        const xl = document.getElementById('extraLargeChests').value || 0;

        // Validation
        if (parseInt(sm) === 0 && parseInt(md) === 0 && parseInt(lg) === 0 && parseInt(xl) === 0) {
            if (mapsDisplay) mapsDisplay.innerHTML = ''; // Clear display if 0.0.0.0 is searched
            return;
        }

        const chestSignature = `${sm}.${md}.${lg}.${xl}`;

        if (mapsDisplay) mapsDisplay.innerHTML = '<p class="status-message">Loading maps from database...</p>';
        showMapsButton.disabled = true;

        try {
            const maps = await fetchMapsBySignaturePublic(chestSignature);

            if (maps.length === 0) {
                // Use the exact wording from the original script.js
                mapsDisplay.innerHTML = '<p class="status-message error">No more valid maps found for the selected combination.</p>';
            } else {
                renderMapList(maps);
            }
        } catch (error) {
            console.error("Error fetching maps:", error);
            if (mapsDisplay) {
                mapsDisplay.innerHTML = `<p class="status-message error">Error connecting to the database. Please try again later.</p>`;
            }
        } finally {
            showMapsButton.disabled = false;
        }
    });

    // Clear all button functionality
    document.getElementById('clearAllButton').addEventListener('click', function() {
        document.querySelectorAll('form').forEach(form => form.reset());
        if (mapsDisplay) mapsDisplay.innerHTML = '';
        // Reset to original default (1 column)
        if (columnSelector) {
            columnSelector.value = "1";
            // Trigger change to update the container classes
            columnSelector.dispatchEvent(new Event('change'));
        }
    });

    // --- Rendering ---
    function renderMapList(maps) {
        if (!mapsDisplay) return;
        mapsDisplay.innerHTML = '';
        const fragment = document.createDocumentFragment();

        maps.forEach(map => {
            // The createMapWrapper function generates the dynamic map view
            const mapWrapper = createMapWrapper(map.id, map.data);
            fragment.appendChild(mapWrapper);
        });

        mapsDisplay.appendChild(fragment);
    }

});