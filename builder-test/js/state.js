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
        mapListContainer: null
    }
};

export function initializeElements() {
    state.elements.boardForm = document.getElementById('boardForm');
    state.elements.chestForm = document.getElementById('chestForm');
    state.elements.gridContainer = document.querySelector('.grid');
    state.elements.boardCodeArea = document.getElementById('boardCodeArea');
    state.elements.searchChestForm = document.getElementById('searchChestForm');
    state.elements.mapListContainer = document.getElementById('mapListContainer');
    
    return Object.values(state.elements).every(el => el !== null);
}