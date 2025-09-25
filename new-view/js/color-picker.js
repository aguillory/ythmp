// js/color-picker.js

// --- Configuration ---
const colorSettings = [
    {
        id: 'body-bg-color',
        cssVar: '--page-background',
        default: '#f0f0f0',
        storageKey: 'pageBackgroundColor'
    },
    {
        id: 'map-wrapper-bg-color',
        cssVar: '--map-wrapper-background',
        default: '#ffffff',
        storageKey: 'mapWrapperBackgroundColor'
    },
    {
        id: 'generated-board-bg-color',
        cssVar: '--generated-board-background',
        default: '#F0F8FF',
        storageKey: 'generatedBoardBackgroundColor'
    }
];

// --- Initialization ---

export function initializeColorPicker() {
    // Initialize the Coloris library
    Coloris({
      el: '.coloris-instance',
      themeMode: 'dark'
    });

    // Load saved colors from localStorage
    loadColorsFromStorage();

    // Set up event listeners for each color input
    colorSettings.forEach(setting => {
        const input = document.getElementById(setting.id);
        if (input) {
            input.addEventListener('input', (e) => {
                const newColor = e.target.value;
                document.documentElement.style.setProperty(setting.cssVar, newColor);
                localStorage.setItem(setting.storageKey, newColor);
            });
        }
    });

    // Set up the reset button
    const resetButton = document.getElementById('reset-colors-btn');
    if (resetButton) {
        resetButton.addEventListener('click', resetColorsToDefault);
    }
}

// --- Core Functions ---

function loadColorsFromStorage() {
    colorSettings.forEach(setting => {
        const savedColor = localStorage.getItem(setting.storageKey);
        const color = savedColor || setting.default;
        
        // Apply the color to the CSS variable
        document.documentElement.style.setProperty(setting.cssVar, color);

        // Update the color picker's input value and visual swatch
        const input = document.getElementById(setting.id);
        if (input) {
            input.value = color;
            // This is for the Coloris library to update its swatch
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
}

function resetColorsToDefault() {
    colorSettings.forEach(setting => {
        // Remove from storage
        localStorage.removeItem(setting.storageKey);
    });
    // Reload the colors, which will now apply the defaults
    loadColorsFromStorage();
}