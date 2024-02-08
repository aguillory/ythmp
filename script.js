document.addEventListener('DOMContentLoaded', function() {
    // Generate options for Small Chests (1-11)
    const smallChestsSelect = document.getElementById('smallChests');
    for (let i = 0; i <= 11; i++) {
        let option = new Option(i, i);
        smallChestsSelect.add(option);
    }

    // Generate options for Medium, Large, Extra Large Chests (1-4)
    ['mediumChests', 'largeChests', 'extraLargeChests'].forEach(selectId => {
        const selectElement = document.getElementById(selectId);
        for (let i = 0; i <= 4; i++) {
            let option = new Option(i, i);
            selectElement.add(option);
        }
    });
});


document.getElementById('chestForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    // Capture the selected values
    const sm = document.getElementById('smallChests').value;
    const md = document.getElementById('mediumChests').value;
    const lg = document.getElementById('largeChests').value;
    const xl = document.getElementById('extraLargeChests').value;

    // Construct the base filename from the selected values
    const fileNameBase = `${sm}.${md}.${lg}.${xl}`;

    // Generate variations from 'a' to 'j'
    const variations = Array.from({length: 10}, (_, i) => String.fromCharCode(97 + i));

    // Clear previous maps
    const mapsDisplay = document.getElementById('mapsDisplay');
    mapsDisplay.innerHTML = '';

    // Display maps for each variation
    variations.forEach(variant => {
        const mapFileName = `maps/${fileNameBase}.${variant}.jpg`;
        const imgElement = document.createElement('img');
        imgElement.src = mapFileName;
        imgElement.alt = "Treasure Map";
        imgElement.onerror = function() { this.style.display = 'none'; }; // Hide if the file doesn't exist
        mapsDisplay.appendChild(imgElement);
    });
});
