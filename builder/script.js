document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('boardForm');

    form.addEventListener('submit', function(event) {
        event.preventDefault(); 

        const tileStates = [];
        const treasures = [];

        for (let i = 1; i <= 25; i++) {
            const stateName = `tileState${i}`;
            const treasureName = `treasure${i}`;

            const stateDropdown = document.querySelector(`select[name="${stateName}"]`);
            const treasureCheckbox = document.querySelector(`input[name="${treasureName}"]`);

            
            tileStates.push(stateDropdown.value);
            treasures.push(treasureCheckbox.checked);
        }


		const boardState = convertTo2DArray(tileStates,treasures);
		const rotate1 = rotateBoardState(boardState);
		const rotate2 = rotateBoardState(rotate1);
		const rotate3 = rotateBoardState(rotate2);
		displayBoards(boardState,"boardTL");
		displayBoards(rotate3,"boardTR");
		displayBoards(rotate2,"boardBR");
		displayBoards(rotate1,"boardBL");


		// Retrieves the values from the select elements
		var smValue = document.getElementById('smallChests').value;
		var mdValue = document.getElementById('mediumChests').value;
		var lgValue = document.getElementById('largeChests').value;
		var xlValue = document.getElementById('extraLargeChests').value;

		// Updates the span elements with the retrieved values
		document.getElementById('sm').textContent = smValue;
		document.getElementById('md').textContent = mdValue;
		document.getElementById('lg').textContent = lgValue;
		document.getElementById('xl').textContent = xlValue;

		document.getElementById('chestheader').style.display = 'flex';
		
		function convertTo2DArray(tileStates, treasures) {
			const size = 5; 
			let boardState = [];

			for (let i = 0; i < size; i++) {
				boardState[i] = [];
				for (let j = 0; j < size; j++) {
					const index = i * size + j; 
					boardState[i][j] = {
						state: tileStates[index],
						treasure: treasures[index]
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
				const rowDiv = document.createElement('div');
				row.forEach((tile) => {
					const tileDiv = document.createElement('div');
					tileDiv.className = `generatedTile ${tile.state.toLowerCase()}`;
					if (tile.treasure) {
						/*const iconDiv = document.createElement('div');
						iconDiv.className = 'treasureIcon';
						tileDiv.appendChild(iconDiv);*/
						tileDiv.classList.add('treasureGenerated'); 
					}
					rowDiv.appendChild(tileDiv);
				});
				boardContainer.appendChild(rowDiv);
			});
		}

    });
});

document.getElementById('clearAllButton').addEventListener('click', function() {
    document.querySelectorAll('form').forEach(form => form.reset());
    document.getElementById('boardTL').innerHTML = '';
    document.getElementById('boardTR').innerHTML = '';
    document.getElementById('boardBR').innerHTML = '';
    document.getElementById('boardBL').innerHTML = '';
});

document.getElementById('downloadMaps').addEventListener('click', function() {
    html2canvas(document.getElementById('printable')).then(function(canvas) {
        // Create an image from the canvas
        let image = canvas.toDataURL('image/png', 1.0);
        
        // Create a link to download the image
        let link = document.createElement('a');
        link.href = image;
        link.download = 'maps.png'; // Specify the download filename
        
        // Trigger the download
        link.click();
    });
});
