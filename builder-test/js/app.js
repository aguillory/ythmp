import { state, initializeElements } from './state.js';
import { generateGridInputs } from './grid.js';
import { setupEventListeners } from './eventHandlers.js';
import { initializeRTE } from './rte.js';
import { setupTabNavigation } from './tabs.js';
import { initializeSearchInterface } from './searchTab.js';

window.initializeBoardBuilder = function() {
    if (state.isInitialized) return;
    
    if (!initializeElements()) {
        console.error("Could not find essential DOM elements. Initialization aborted.");
        return;
    }

    generateGridInputs();
    setupEventListeners();
    initializeRTE();
    setupTabNavigation();
    initializeSearchInterface();

    state.isInitialized = true;
}