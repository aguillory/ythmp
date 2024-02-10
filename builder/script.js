document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('boardForm'); // Ensure this matches your form's ID

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        const tileStates = [];
        const treasures = [];

        // Assuming there are 25 tiles
        for (let i = 1; i <= 25; i++) {
            // Construct the name attributes for dropdowns and checkboxes
            const stateName = `tileState${i}`;
            const treasureName = `treasure${i}`;

            // Find the dropdown and checkbox for the current tile
            const stateDropdown = document.querySelector(`select[name="${stateName}"]`);
            const treasureCheckbox = document.querySelector(`input[name="${treasureName}"]`);

            // Gather the state and treasure indicator
            tileStates.push(stateDropdown.value);
            treasures.push(treasureCheckbox.checked);
        }

        console.log(tileStates); // Log the collected states
        console.log(treasures); // Log the treasure indicators
		generatePrimaryBoard(tileStates, treasures);

        // Here, you can add logic to process these values and generate the visual representation
		
		function generatePrimaryBoard(tileStates, treasures) {
			const boardContainer = document.createElement('div');
			boardContainer.className = 'generatedBoard';

			tileStates.forEach((state, index) => {
				const tile = document.createElement('div');
				tile.className = `generatedTile ${state.toLowerCase()}`; // Updated class names
				if (treasures[index]) {
					tile.classList.add('treasureGenerated'); // Updated class name
				}
				boardContainer.appendChild(tile);
			});

			// Append the board to a specific element in your document
			const boardDisplay = document.getElementById('boardDisplayGenerated'); // Ensure this ID is unique
			boardDisplay.innerHTML = ''; // Clear previous board
			boardDisplay.appendChild(boardContainer);
		}

    });
});
