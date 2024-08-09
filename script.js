document.addEventListener('DOMContentLoaded', function() {

    const smallChestsSelect = document.getElementById('smallChests');
    for (let i = 0; i <= 11; i++) {
        let option = new Option(i, i);
        smallChestsSelect.add(option);
    }
    
    ['mediumChests', 'largeChests', 'extraLargeChests'].forEach(selectId => {
        const selectElement = document.getElementById(selectId);
        for (let i = 0; i <= 4; i++) {
            let option = new Option(i, i);
            selectElement.add(option);
        }
    });

    document.getElementById('columnSelector').value = "1";
    document.getElementById('mapsDisplay').className = 'columns-1';

    // Function to handle increment and decrement
    function updateSelectValue(selectElement, increment) {
        let currentValue = parseInt(selectElement.value);
        let newValue = currentValue + increment;
        
        // Ensure the new value is within the allowed range
        if (newValue >= 1 && newValue <= 4) {
            selectElement.value = newValue;
            // Trigger change event to update the display
            selectElement.dispatchEvent(new Event('change'));
        }
    }

    // Attach event listeners to all increment and decrement buttons
    document.querySelectorAll('.increment').forEach(function(button) {
        button.addEventListener('click', function() {
            let selectElement = this.previousElementSibling;
            updateSelectValue(selectElement, 1);
        });
    });

    document.querySelectorAll('.decrement').forEach(function(button) {
        button.addEventListener('click', function() {
            let selectElement = this.nextElementSibling;
            updateSelectValue(selectElement, -1);
        });
    });

    // Update the number of columns displayed when the column selector changes
    document.getElementById('columnSelector').addEventListener('change', function() {
        let columns = this.value;
        document.getElementById('mapsDisplay').className = `columns-${columns}`;
    });



    // Example to fill the select options dynamically
    const maxOptions = {
        smallChests: 11,
        mediumChests: 9,
        largeChests: 7,
        extraLargeChests: 5
    };

    for (const [key, max] of Object.entries(maxOptions)) {
        const select = document.getElementById(key);
        for (let i = 0; i <= max; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = i;
            select.appendChild(option);
        }
    }
    
      const columnSelector = document.getElementById('columnSelector');
    const mapContainer = document.getElementById('map-container');

    columnSelector.addEventListener('change', function() {
        // Remove existing column classes
        mapContainer.classList.remove('columns-1', 'columns-2', 'columns-3', 'columns-4');

        // Get the selected number of columns
        const selectedColumns = columnSelector.value;

        // Add the selected column class to the map container
        mapContainer.classList.add(`columns-${selectedColumns}`);
    });

    // Initialize with the default 1 column layout
    mapContainer.classList.add('columns-1');
});
let formSubmitted = false;

document.getElementById('chestForm').addEventListener('submit', function(event) {
    event.preventDefault();
    formSubmitted = true;
    const sm = document.getElementById('smallChests').value;
    const md = document.getElementById('mediumChests').value;
    const lg = document.getElementById('largeChests').value;
    const xl = document.getElementById('extraLargeChests').value;
    

    const fileNameBase = `${sm}.${md}.${lg}.${xl}`;
    

    const variations = Array.from({length: 10}, (_, i) => String.fromCharCode(97 + i));
    
    const mapsDisplay = document.getElementById('mapsDisplay');
    mapsDisplay.innerHTML = '';
    
    let validMapsFound = 0; 
    var delayInMilliseconds = 1000; 

setTimeout(function() {
}, delayInMilliseconds);
    function checkAndShowError() {
        const existingError = mapsDisplay.querySelector('p');
        if (existingError) {
            mapsDisplay.removeChild(existingError);
        }
        
        if (formSubmitted && validMapsFound === 0 && (sm > 0 || md > 0 || lg > 0 || xl > 0)) { 
            const errorMessage = document.createElement('p');
            errorMessage.textContent = "No more valid maps found for the selected combination.";
            mapsDisplay.appendChild(errorMessage);
        }
    }
    
    variations.forEach(variant => {
        const mapFileName = `maps/${fileNameBase}.${variant}.jpg`;
        const imgElement = document.createElement('img');
        imgElement.src = mapFileName;
        imgElement.alt = "Treasure Map";
        imgElement.onload = () => validMapsFound++; 
        imgElement.onerror = function() {
            this.style.display = 'none';
            if (variant === variations[variations.length - 1]) {
                checkAndShowError();
            }
        };
        mapsDisplay.appendChild(imgElement);
    });
    
    
});
document.getElementById('clearAllButton').addEventListener('click', function() {
    formSubmitted = false;
    document.querySelectorAll('form').forEach(form => form.reset());
    document.getElementById('mapsDisplay').innerHTML = '';
    validMapsFound = 0;
});