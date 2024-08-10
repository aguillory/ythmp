document.addEventListener('DOMContentLoaded', function() {
    // Define the ranges for each select element
    const chestConfigs = {
        smallChests: { min: 0, max: 11 },
        mediumChests: { min: 0, max: 9 },
        largeChests: { min: 0, max: 7 },
        extraLargeChests: { min: 0, max: 5 },
        columnSelector: { min: 1, max: 4 }
    };

    const columnSelector = document.getElementById('columnSelector');
    const mapContainer = document.getElementById('map-container');
    // Populate select elements based on their defined ranges
    Object.keys(chestConfigs).forEach(selectId => {
        const selectElement = document.getElementById(selectId);
        const config = chestConfigs[selectId];

        // Clear any existing options to avoid duplicates
        selectElement.innerHTML = '';

        // Populate options
        for (let i = config.min; i <= config.max; i++) {
            let option = new Option(i, i);
            selectElement.add(option);
        }
    });

    // Set initial value for the column selector and layout
    document.getElementById('columnSelector').value = "1";
    document.getElementById('mapsDisplay').className = 'columns-1';

    // Function to handle increment and decrement
    function updateSelectValue(selectElement, increment) {
        const config = chestConfigs[selectElement.id];
        let currentValue = parseInt(selectElement.value);
        let newValue = currentValue + increment;
        
        // Ensure the new value is within the allowed range
        if (newValue >= config.min && newValue <= config.max) {
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

        setTimeout(function() {}, delayInMilliseconds);

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

    // Clear all button functionality
    document.getElementById('clearAllButton').addEventListener('click', function() {
        formSubmitted = false;
        document.querySelectorAll('form').forEach(form => form.reset());
        document.getElementById('mapsDisplay').innerHTML = '';
        validMapsFound = 0;
    });

});
