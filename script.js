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
    
    function checkAndShowError() {
        const existingError = mapsDisplay.querySelector('p');
        if (existingError) {
            mapsDisplay.removeChild(existingError);
        }
        
        if (formSubmitted && validMapsFound === 0 && (sm > 0 || md > 0 || lg > 0 || xl > 0)) { 
            const errorMessage = document.createElement('p');
            errorMessage.textContent = "No valid maps found for the selected combination.";
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