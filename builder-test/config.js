export const CONFIG = {
    GRID_SIZE: 5,
    TILE_OPTIONS: [
        { value: "blank", text: "Blank" },
        { value: "one", text: "1" }, 
        { value: "two", text: "2" },
        { value: "three", text: "3" }, 
        { value: "four", text: "4" },
        { value: "five", text: "5" }, 
        { value: "six", text: "6" },
        { value: "threex", text: "3x" }, 
        { value: "fourx", text: "4x" },
        { value: "yahtzee", text: "Yahtzee" }, 
        { value: "chance", text: "?" },
        { value: "pair", text: "2 Pair" }, 
        { value: "odds", text: "Odds" },
        { value: "evens", text: "Evens" }, 
        { value: "full", text: "Full House" },
        { value: "sm", text: "Sm Straight" }, 
        { value: "lg", text: "Lg Straight" }
    ],
    BORDER_OPTIONS: [
        { value: "none", text: "None" },
        { value: "black", text: "Black" },
        { value: "brown", text: "Brown" },
        { value: "silver", text: "Silver" },
        { value: "purple", text: "Purple" },
        { value: "gold", text: "Gold" }
    ],
    CHEST_COUNTS: {
        small: { min: 0, max: 11 },
        medium: { min: 0, max: 4 },
        large: { min: 0, max: 4 },
        extraLarge: { min: 0, max: 4 }
    }
};

// Quill toolbar configuration
export const QUILL_TOOLBAR_OPTIONS = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'clean']
];