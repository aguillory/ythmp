// Global state management
export const state = {
    quillEditor: null,
    isInitialized: false,
    elements: {
        boardForm: null,
        chestForm: null,
        gridContainer: null,
        boardCodeArea: null,
        searchChestForm: null,
        mapListContainer: null,
        allMapsListContainer: null,
        idSearchForm: null // ADDED
    }
};

export function initializeElements() {
    state.elements.boardForm = document.getElementById('boardForm');
    state.elements.chestForm = document.getElementById('chestForm');
    state.elements.gridContainer = document.querySelector('.grid');
    state.elements.boardCodeArea = document.getElementById('boardCodeArea');
    state.elements.searchChestForm = document.getElementById('searchChestForm');
    state.elements.mapListContainer = document.getElementById('mapListContainer');
    state.elements.allMapsListContainer = document.getElementById('allMapsListContainer'); 
    state.elements.idSearchForm = document.getElementById('idSearchForm'); // ADDED
    
    // Check all except allMapsListContainer, which is not critical for init
    const criticalElements = [
        state.elements.boardForm,
        state.elements.chestForm,
        state.elements.gridContainer,
        state.elements.boardCodeArea,
        state.elements.searchChestForm,
        state.elements.mapListContainer,
        state.elements.idSearchForm
    ];
    
    return criticalElements.every(el => el !== null);
}