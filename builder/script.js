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


		//generatePrimaryBoard(tileStates, treasures);
		const boardState = convertTo2DArray(tileStates,treasures);
		const rotate1 = rotateBoardState(boardState);
		const rotate2 = rotateBoardState(rotate1);
		const rotate3 = rotateBoardState(rotate2);
		displayBoards(boardState,"boardTL");
		displayBoards(rotate3,"boardTR");
		displayBoards(rotate2,"boardBR");
		displayBoards(rotate1,"boardBL");


		
		
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