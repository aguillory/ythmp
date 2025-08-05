document.addEventListener('DOMContentLoaded', () => {
    
    // Function to dynamically generate the tile inputs
    function generateGridInputs() {
        const gridContainer = document.querySelector('.grid');
        if (!gridContainer) return;

        // Define all possible tile options in one place for easy maintenance
        const tileOptions = [
            { value: "X", text: "Unused" },
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
        ];

        // Loop 25 times to create each tile
        for (let i = 1; i <= 25; i++) {
            const tileDiv = document.createElement('div');
            tileDiv.className = 'tile';

            // Create the dropdown (select)
            const select = document.createElement('select');
            select.name = `tileState${i}`;

            // Populate the dropdown with options
            tileOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                select.appendChild(option);
            });

            // Create the "Treasure" checkbox
            const treasureCheckbox = document.createElement('input');
            treasureCheckbox.type = 'checkbox';
            treasureCheckbox.name = `treasure${i}`;
            const treasureLabel = document.createTextNode(' Treasure?');

            // Create the "Star" checkbox
            const starCheckbox = document.createElement('input');
            starCheckbox.type = 'checkbox';
            starCheckbox.name = `star${i}`;
            const starLabel = document.createTextNode(' Star?');

            // Append all new elements to the tile div
            tileDiv.appendChild(select);
            tileDiv.appendChild(treasureCheckbox);
            tileDiv.appendChild(treasureLabel);
            tileDiv.appendChild(starCheckbox);
            tileDiv.appendChild(starLabel);
            
            // Append the completed tile to the grid
            gridContainer.appendChild(tileDiv);
        }
    }

    // Call the function to build the inputs when the page loads
    generateGridInputs();
    
    // Your existing form submission logic
    const form = document.getElementById('boardForm');
    form.addEventListener('submit', function(event) {
        event.preventDefault(); 

        const tileStates = [];
        const treasures = [];
        const stars = [];

        for (let i = 1; i <= 25; i++) {
            const stateName = `tileState${i}`;
            const treasureName = `treasure${i}`;
            const starName = `star${i}`;

            const stateDropdown = document.querySelector(`select[name="${stateName}"]`);
            const treasureCheckbox = document.querySelector(`input[name="${treasureName}"]`);
            const starCheckbox = document.querySelector(`input[name="${starName}"]`);
            
            tileStates.push(stateDropdown.value);
            treasures.push(treasureCheckbox.checked);
            stars.push(starCheckbox.checked);
        }

		const boardState = convertTo2DArray(tileStates,treasures, stars);
		const rotate1 = rotateBoardState(boardState);
		const rotate2 = rotateBoardState(rotate1);
		const rotate3 = rotateBoardState(rotate2);
		displayBoards(boardState,"boardTL");
		displayBoards(rotate3,"boardTR");
		displayBoards(rotate2,"boardBR");
		displayBoards(rotate1,"boardBL");
		
		var copies = document.getElementById('copies').value;
		var copies2 = document.getElementById('copies2').value;
		var smValue = document.getElementById('smallChests').value;
		var mdValue = document.getElementById('mediumChests').value;
		var lgValue = document.getElementById('largeChests').value;
		var xlValue = document.getElementById('extraLargeChests').value;
		const selectedCopyIcon = document.querySelector('input[name="copyType"]:checked').value;
		
		if (copies > 0 && copies2 > 0 && copies <= copies2){
			document.getElementById('copytxt').textContent = copies;
			document.getElementById('copy2txt').textContent = copies2;
			document.getElementById('copyIcon').src = selectedCopyIcon;
			document.getElementById('copy').style.display = 'flex';
		} 

		if (smValue > 0){
			document.getElementById('smtxt').textContent = smValue;
			document.getElementById('sm').style.display = 'flex';
		}
		if (mdValue > 0){
			document.getElementById('mdtxt').textContent = mdValue;
			document.getElementById('md').style.display = 'flex';
		}
		if (lgValue > 0){
			document.getElementById('lgtxt').textContent = lgValue;
			document.getElementById('lg').style.display = 'flex';
		}
		if (xlValue > 0){
			document.getElementById('xltxt').textContent = xlValue;
			document.getElementById('xl').style.display = 'flex';
		}
		
		document.getElementById('chestheader').style.display = 'flex';
		document.getElementById('chestheader').style.justifyContent = 'center';
		document.getElementById('chestfooter').style.display = 'block';
		document.getElementById('chestfooter').style.justifyContent = 'center';

		function convertTo2DArray(tileStates, treasures, stars) {
			const size = 5; 
			let boardState = [];
			for (let i = 0; i < size; i++) {
				boardState[i] = [];
				for (let j = 0; j < size; j++) {
					const index = i * size + j; 
					boardState[i][j] = {
						state: tileStates[index],
						treasure: treasures[index],
						star: stars[index]
					};
				}
			}
			return boardState;
		}

		function rotateBoardState(boardState) {
			const size = boardState.length;
			let newBoard = [];
			for (let i = 0; i < size; i++) {
				newBoard.push([]);
				for (let j = 0; j < size; j++) {
					newBoard[i][j] = boardState[size - j - 1][i];
				}
			}
			return newBoard;
		}

		function displayBoards(boardState, containerId) {
			const boardContainer = document.getElementById(containerId);
			boardContainer.innerHTML = ''; 
			boardContainer.className = 'generatedBoard';
			boardState.forEach((row) => {
				// This was creating an extra div per row, let's fix it
				row.forEach((tile) => {
					const tileDiv = document.createElement('div');
					tileDiv.className = `generatedTile ${tile.state.toLowerCase()}`;
					if (tile.treasure) {
						tileDiv.classList.add('treasureGenerated'); 
					}
					if (tile.star) {
						tileDiv.classList.add('starGenerated');
					}
					boardContainer.appendChild(tileDiv); // Append tile directly to the board container
				});
			});
		}
    });
});

document.getElementById('clearAllButton').addEventListener('click', function() {
    window.location.reload(true);
});