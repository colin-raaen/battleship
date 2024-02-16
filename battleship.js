//Let forms load first before executing
document.addEventListener('DOMContentLoaded', function(){   
    // Variables to track game
    const arrayLength = 14; // constant for array length
    const playerShipLocations = []; // Declare array to store player's ship coordinates
    const computerShipLocations = []; // Declare array to store computer's ship coordinates
    const playerTargetHistory = []; // Declare array to store player's hit board
    const computerTargetHistory = []; // Declare array to store computer's hit board
    let battleshipWinner = false; // declare variable to track if winner has been determined
    let angle = 0; // variable for horizontal or vertical placement of ship, initially set to 0 for vertical
    let notDropped; // boolean variable to store if player ship drag and drop placement was successful
    let startId; // variable to store id of first cell where to place a ship
    let placingShip = true; // variable to determine if ship is being placed, initially start as true until game starts

    // Ship Class constructor, taking name, length and width as inputs
    class Ship {
        constructor (name, length, width){
            this.name = name;
            this.length = length;
            this.width = width;
            this.sunk = false;
            this.hitCount = 0;
            this.shipSize = length * width;
        }
    }

    // Call constructor to construct 5 ships for game
    const carrier = new Ship('carrier', 5, 2);
    const battleship = new Ship('battleship', 6, 1);
    const cruiser = new Ship('cruiser', 5, 1);
    const submarine = new Ship('submarine', 4, 1);
    const destroyer = new Ship('destroyer', 2, 1);
    // store ships in an array to access
    const shipsArray = [carrier, battleship, cruiser, submarine, destroyer];

    // Call constructor to construct 5 ships for game
    const computerCarrier = new Ship('carrier', 5, 2);
    const computerBattleship = new Ship('battleship', 6, 1);
    const computerCruiser = new Ship('cruiser', 5, 1);
    const computerSubmarine = new Ship('submarine', 4, 1);
    const computerDestroyer = new Ship('destroyer', 2, 1);
    // store ships in an array to access
    const computerShipsArray = [computerCarrier, computerBattleship, computerCruiser, computerSubmarine, computerDestroyer];

    let computerHitNotSunk = false; // variable to track when the comnputer has hit a ship but not sunk it yet
    let computerLastMoveHitRow; // variable to store row of last computer move if it was a hit
    let computerLastMoveHitCol; // variable to store column of last computer move if it was a hit

    // HTML Elements to listen for clicks
    const body = document.getElementById('body');// store add button element
    const startButton = document.getElementById('start-button'); // store start buttom HTML element
    
    const playerBoardContainer = document.getElementById('player-generated-board'); // container for player board
    const computerBoardContainer = document.getElementById('computer-generated-board'); // container for computer board
    const playerBoardCells = document.getElementsByClassName('player-cell'); // cells within player board
    const computerBoardCells = document.getElementsByClassName('computer-cell'); // cells within computer board
    const playerFlashMessage = document.getElementById('player-flash-message'); // div for flash message
    const computerFlashMessage = document.getElementById('computer-flash-message'); // div for flash message
    const shipsToPlaceContainer = document.getElementById('your-ships'); // ships to place headers

    const shipsToPlace = Array.from(document.getElementsByClassName("player-ship")); // store the ships to place
    let shipDraggedElement; // variable to store HTML element of the ship that is currently being dragged by player
    let shipDraggedId; // variable that stores just the HTML ID from shipDraggedElement
    let shipType; // variable to store just the string name of the ship from shipDraggedId
    let draggedShip; // variable to store the ship object of current ship being dragged  

    // CALL FUNCTION TO INITIALIZE HTML GAME BOARDS AND ARRAYS
    generateTable('player-cell', playerBoardContainer);
    generateTable('computer-cell', computerBoardContainer);

    // helper function to generate game boards
    function generateTable(playerCell, boardContainer){
        // Nested For loop to dynamically generate players board on HTML page load
        for (let row = 0; row < arrayLength; row++) {
            for (let col = 0; col < arrayLength; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell', playerCell);
                cell.id = `${playerCell + "-" + row + "-" + col}`;
                cell.dataset.cell = `${row + "-" + col}`;
                cell.dataset.state = 'empty';
                boardContainer.appendChild(cell); // append new cell to board HTML container
            }
        }
    }

    // For loop to create 2-d arrays for ship locations and target history
    for (let i = 0; i < arrayLength; i++) {
        // create player ship location 2-d array and populate initially with '-'
        playerShipLocations.push(new Array(arrayLength).fill().map(() => ({
            shipType: '-', // Initialize ship type with '-'
            status: '-', // Initialize hit status to false
        })));
        // create computer ship location 2-d array with objects
        computerShipLocations.push(new Array(arrayLength).fill().map(() => ({
            shipType: '-', // Initialize ship type with '-'
            status: '-', // Initialize hit status to false
        })));

        playerTargetHistory.push(new Array(arrayLength).fill('-')); // create player target history 2-d array
        computerTargetHistory.push(new Array(arrayLength).fill('-')); // create computer target history 2-d array
    }
    
    // loop through array of ships to randomly generate ships onto computer board
    for (let i = 0; i < computerShipsArray.length; i++){
        addShip('computer', computerShipsArray[i]);
    }

    // DELEGATED EVENT HANDLER FOR PLAYER CLICKS
    body.addEventListener('click', function(event) {
        // if game is over then exit
        if (battleshipWinner === true){ return; }

        // if reset button is clicked
        if (event.target.id.includes('reset-button')){
            handleResetButton(); // call function to handle game reset
        }

        // if turn ship button is clicked
        if (event.target.id.includes('turn-button')){
            handleTurnShip(); // call function to handle ship turn
        }

        // if click is on start button
        if (event.target === startButton){
            startGame(); // call function to start game
        } 

        // if event is players move, clicking the computers board
        if (placingShip === false && event.target.id.includes('computer-cell')){
            handlePlayerMove(event); // call function to handle players move
            let winnerCheck = checkWinner(); // call function to check for winner

            // check if winner is the player
            if (winnerCheck === 'player'){
                placingShip = true; // end game and set to true
                handleFlashMessage('player');
                return; // don't generate another move
            }

            setTimeout(function(){ // delay computer move function call and winnerCheck function call
                generateComputerMove(); // call function to generate Computer's move
                winnerCheck = checkWinner(); // call function to check for winner

                // check if winner is computer
                if (winnerCheck === 'computer'){
                    placingShip = true; // end game and set to true
                    handleFlashMessage('computer'); // call flash message with computer as winner
                }
            }, 500); // delay by .5 seconds
        }
    });

    // EVENT HANDLERS FOR DRAG AND DROP PLACEMENT OF SHIPS
    for (const ship of shipsToPlace){
        ship.addEventListener('dragstart', handleDragStart); // call dragStart function when ship is started to drag
        ship.addEventListener('touchstart', function(event) {  // MOBILE, Call functions to handle touch dragging
            handleDragStart(event); // call dragStart to store which ship is being dragged
            handleTouchStart(event); // helper function to get location of touch on the screen
        });
        // Call touchmove function to dynamically update location of ship as it's dragged
        ship.addEventListener('touchmove', handleTouchMove); 
        ship.addEventListener('touchend', handleShipTouchEnd); // mobile drag and drop
    }

    // add listener event for every cell of player's board to listen for dragover, dragleave, and drop of ships
    for (cell of playerBoardCells){
        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('drop', handleDrop); // add listener event for drop of ship on the board
    }

    // HELPER FUNCTIONS FOR DRAG AND DROP OF SHIPS
    // helper function to handle when player starts to drag ship
    function handleDragStart (event){
        shipCells = []; // set shipCells to blank
        angle = 0; // set angle to vertical

        // store HTML element, used to hide or display placement ship in handle drop function
        shipDraggedElement = event.target; 

        // Find the closest ancestor with the class "player-ship", used for mobile drag and drop, results in same elemnt with desktop
        // needed for entire placement ship vs single cell getting stored on mobile
        shipDraggedElement = shipDraggedElement.closest('.player-ship');

        shipDraggedId = shipDraggedElement.id; // store id of current ship being dragged
        shipType = shipDraggedId.substring("player-".length); // Remove "player-" prefix to get name of ship type
        // Get the dragged ship object from the array using shipType
        draggedShip = shipsArray.find(ship => ship.name === shipType);
        notDropped = false; // set notDropped to false to properly remove ship once placed, reset if previously dropped ship occurred
    }

    // helper function used for mobile drag and drop to capture inital X and Y position of users touch
    function handleTouchStart(event) {
        const touch = event.touches[0];
        initialX = touch.clientX;
        initialY = touch.clientY;
    }

    // Mobile drage and drop helper function to dynamically move the ship as the player drags the ship
    function handleTouchMove(event) {
        event.preventDefault(); // prevent dault behavior

        const touch = event.touches[0]; // get touch information
        const offsetX = touch.clientX - initialX; // calculate X offset
        const offsetY = touch.clientY - initialY; // calculate Y offset
        // Move ship to calculated location
        shipDraggedElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`; 
    }

    // helper function to handle when ship is dragged over players board
    function handleDragOver (event){
        event.preventDefault(); // Prevent default behavior to enable drop        
    }

    // Mobile Drag and Drop helper function for when Ship is dropped, touch end on ship
    function handleShipTouchEnd(event) {
        // Get the touch position and touch end
        const touch = event.changedTouches[0];
        const clientX = touch.clientX;
        const clientY = touch.clientY;

        // Calculate the position relative to the board container
        const rect = playerBoardContainer.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;

        // Calculate the row and column indices based on the cell size
        const cellSize = rect.width / arrayLength; // Assuming equal-sized cells
        const colIndex = Math.floor(offsetX / cellSize);
        const rowIndex = Math.floor(offsetY / cellSize);

        // Calculate the startId based on row and column indices
        startId = Number((rowIndex * arrayLength) + colIndex);
        
        // Check if the ship should snap back
        if (colIndex < 0 || colIndex > arrayLength || rowIndex < 0 || rowIndex > arrayLength) {
            snapBackShip(); // call snapback function
            return; // exit function
        }
        else{ // if not out of bounds, over board, call add ship function
            addShip('player', draggedShip, startId);
        }
       
        // if ship is successfully dropped
        if (!notDropped){
            hideShip(); // call function to hide placement ship if successfully placed on board
            // snap back ship in case it needs to be reshown, turn ship doesn't work
            snapBackShip();
        }
        else{
            snapBackShip(); // not sucessfully place, call function to snapback to original position
        }
    }

    // helper function to handle when ship is dropped onto board (desktop drag and drop)
    function handleDrop (event){
        targetCellElement = event.target; // store target cell
        // call function to get row and column indices
        const [rowIndex, colIndex] = getRowAndColumn(targetCellElement);
        startId = Number((rowIndex * 14) + colIndex); // calculate startId based on row and column index

        // call function to add ship to board
        addShip('player', draggedShip, startId);
        // if ship is successfully dropped
        if (!notDropped){
            hideShip(); // call function to hide placement ship if successfully placed on board
        }
    }

    // helper function for mobile drag and drop to snap back ship to original position
    function snapBackShip(){
        // Snap back to the original position
        shipDraggedElement.style.transition = 'transform 0.3s ease'; // Add a smooth transition
        shipDraggedElement.style.transform = 'translate(0, 0)';
        setTimeout(() => {
            // Reset transition after snapping back
            shipDraggedElement.style.transition = 'none';
        }, 300); // Adjust the duration based on your preference
    }

    // helper function to hide ship
    function hideShip(){
        shipDraggedElement.style.display = "none"; // hide ship 
        const shipTitle = draggedShip.name + "-name"; // concatenate ship title name
        const shipTitleElement = document.getElementById(shipTitle); // Get ship title HTML element
        shipTitleElement.style.display = "none"; // hide ship title
    }

    // Helper function to add ship to board
    function addShip(user, ship, startId) {
        let valid; // variable to store and check if starting index does not overflow rows
        let cellsBlank; // variable to store and check is cell is overlapping
        const shipCells = []; // create empty array to store cells where ship will be placed

        // Ternary statements to store which arrays to access based on whether computer or player
        const userShipLocations = user === 'player' ? playerShipLocations : computerShipLocations;
        const userBoardCells = user === 'player' ? playerBoardCells : computerBoardCells;

        let randomIndex = Math.floor(Math.random() * arrayLength * arrayLength); // generate random number between 1-14 round down
        // if start id passed in for player ship, use startId, otherwise use random start index for computer
        let startIndex = user === 'player' ? startId : randomIndex;
        // if user is player than use angle, otherwise if computer, generate random boolean that is true or false
        let isHorizontal = user === 'player' ? angle === 90 : Math.random() < 0.5; 

        // check if horizontal ship, is it within range of the end of the board, return the random index, otherwise
        // return the last possible index. Takes into consideration the width of the ship
        let validStart = isHorizontal ? startIndex <= arrayLength * arrayLength - (ship.length + ((ship.width - 1) * arrayLength))  ? 
            startIndex : arrayLength * arrayLength - (ship.length + ((ship.width - 1) * arrayLength)) :
            // handle vertical, takes into consideration width of ship
            // if Startindex is less than last possible vertical spot, return original number
            startIndex <= arrayLength * arrayLength - ((ship.length - 1)  * arrayLength) - ship.width ? startIndex : 
            // otherwise Subtract 14 going up the column until a valid value is found
            (function() {
                // Subtract 14 until a value less than last possible vertical spot is reached
                while (startIndex >= (arrayLength * arrayLength - ((ship.length - 1)  * arrayLength) - ship.width)) {
                    startIndex -= 14;
                }
                // Return the modified startIndex
                return startIndex;
            })();

        // loop through ship cells placement starting with validStart to validate starting ship placement
        for(let i = 0; i < ship.width; i++){ // columns
            for(let j = 0; j < ship.length; j++){
                if (isHorizontal){ // if horizontal position randomly selected
                    // push the cell from computer cell board into shipCells array for length of ship
                    shipCells.push(userBoardCells[Number(validStart) + j + (i * arrayLength)])
                }
                else{ // vertical position randomly selected
                    // push the cell from computer cell board into shipCells array for length of ship
                    shipCells.push(userBoardCells[Number(validStart) + (j * arrayLength) + i])
                }
               
            }
        }

        // check to make sure ship doesn't split across rows
        if (isHorizontal){ // if is a horizontal ship
            // loop through every ship cell on ship placement
            valid = shipCells.every((_shipCell) => {
                // call function to get row and column indices
                const [rowIndex, colIndex] = getRowAndColumn(shipCells[0])

                // determine if start index is less or equal to edge of the board minus the length of the ship
                // taking into consideration width of ship with && conditional
                return arrayLength - ship.length >= colIndex && arrayLength - ship.width >= rowIndex;
            })
        }
        else{
            valid = shipCells.every((_shipCell) => {
                // call function to get row and column indices
                const [rowIndex, colIndex] = getRowAndColumn(shipCells[0])

                // determine if start index is less or equal to edge of the board minus the length of the ship
                return arrayLength - ship.length >= rowIndex && arrayLength - ship.width >= colIndex;
            })
        }

        // check to make sure not already a ship that overlaps // loop through every ship cell on ship placement
        for (let i = 0; i < shipCells.length; i++){
            // call function to get row and column indices for each cell of the ship
            const [rowIndex, colIndex] = getRowAndColumn(shipCells[i])

            // determine if current cell location has already been taken by another ship
            if (userShipLocations[rowIndex][colIndex].status === '-'){
                cellsBlank = true;
            }
            else{ // else if cell
                cellsBlank = false;
                break; // terminate rest of for loop
            }
        }

        // update game board on HTML page if start index doesn't cause row overflow
        if (valid && cellsBlank){
            for(let i = 0; i < shipCells.length; i++){
                // only update HTML board if user is player
                if(user === 'player'){
                    shipCells[i].classList.add(ship.name); // add ships name to class of cell
                }
                // call function to get row and column indices
                const [rowIndex, colIndex] = getRowAndColumn(shipCells[i])

                // update computer ship location array
                userShipLocations[rowIndex][colIndex].status = 'X';
                userShipLocations[rowIndex][colIndex].shipType = ship; // store ship object at location

            }
        }
        else { // else ship placement causes row overflow or cell is already taken, then call function again
            if (user === 'computer'){ //only for unsuccesful placement of computer ships
                addShip(user, ship); //keeps calling function until valid placement is found
            }
            if (user === 'player'){ //only for unsuccessful placement of player ships
                notDropped = true; // set not Dropped to true to prevent successful placement
            }
        }
    }

    // Helper function to get Row and Column of a cell from data attribute of HTML element
    function getRowAndColumn(shipCell) {
        let cellNumber = shipCell.getAttribute('data-cell'); // Store row number of cell that is clicked
        // Split the string into row and column parts
        const [rowString, colString] = cellNumber.split('-');
      
        // Convert the string parts into integers
        const rowIndex1 = parseInt(rowString, 10);
        const colIndex1 = parseInt(colString, 10);
      
        return [rowIndex1, colIndex1]; // return row and column
    }

    // Helper function to turn ship when turn ship button is clicked
    function handleTurnShip (){
        // get all all the cells of the ship that needs to be turned
        const shipCellsToDelete = Array.from(document.getElementsByClassName("cell player-cell " + draggedShip.name));

        // update computer's board on HTML page if start index doesn't cause row overflow
        for (let i = 0; i < shipCellsToDelete.length; i++){
            shipCellsToDelete[i].classList.remove(draggedShip.name); // remove ships name to class of cell
            const [rowIndex, colIndex] = getRowAndColumn(shipCellsToDelete[i]); // call function to get row and column indices
            playerShipLocations[rowIndex][colIndex].status = '-'; // blank out current computer ship location array
        }

        // if angle is zero, set to 90, else set to 0
        angle = (angle === 0) ? 90 : 0;
        
        // call function to add ship to board
        addShip('player', draggedShip, startId);

        // if turn is not successful, reshow ship
        if (notDropped){
            shipDraggedElement.style.display = "block"; // hide ship 
            const shipTitle = draggedShip.name + "-name"; // concatenate ship title name
            const shipTitleElement = document.getElementById(shipTitle); // Get ship title HTML element
            shipTitleElement.style.display = "block"; // hide ship title
        }
    }

    // HELPER FUNCTIONS TO HANDLE GAME ACTIVITY
    // function to handle start of the game when start button is clicked
    function startGame() {
        // Loop through ships to place and check to make sure player has placed all ships
        for (let i = 0; i < shipsToPlace.length; i++) {
            const styles = window.getComputedStyle(shipsToPlace[i]);
            const displayStyle = styles.getPropertyValue('display'); // get specific display property
        
            // if display style is not equal to none (ship placed) than throw error message and exit function
            if (displayStyle !== 'none'){
                alert("Please place all 5 ships in order to start the game");
                return;
            } 
        }

        startButton.style.display = "none"; // hide the start button
        shipsToPlaceContainer.style.display = "none"; // hide ships to place container
        placingShip = false; // set place ship to false to allow start of game
        alert("Select a cell on the Computer's board to start the game"); // prompt user to position ships
    }
    
    // Helper function to handle player's move
    function handlePlayerMove(event){
        const cellClicked = event.target; // Store HTML cell that was clicked from event 

        // call function to get row and column indices
        const [rowIndex, colIndex] = getRowAndColumn(cellClicked)

        // check if cell clicked was already selected
        if (playerTargetHistory[rowIndex][colIndex] === 'X' || playerTargetHistory[rowIndex][colIndex] === 'O'){
            alert("Location has already been selected, please select another cell"); // throw error message 
            return; // exit
        }

        // check if cell clicked was has hit computers ship
        if (computerShipLocations[rowIndex][colIndex].status === 'X'){
            // update HTML element with hit color 
            cellClicked.classList.add('ship-hit'); // update HTML class to update styling
            cellClicked.setAttribute("data-state", "filled"); // update data-state

            playerTargetHistory[rowIndex][colIndex] = 'X'; // mark player target history array with hit
            // update hit count of 
            computerShipLocations[rowIndex][colIndex].shipType.hitCount = computerShipLocations[rowIndex][colIndex].shipType.hitCount + 1; 

            // if last location of ship and sunk ship, call flash message for sunk ship
            if(computerShipLocations[rowIndex][colIndex].shipType.hitCount === computerShipLocations[rowIndex][colIndex].shipType.shipSize){
                handleFlashMessage('player', computerShipLocations[rowIndex][colIndex].shipType.name);// call function to generate flash message
            }
        }
        else {
            // update HTML element with miss color 
            cellClicked.classList.add('ship-missed'); // update HTML class to update styling
            cellClicked.setAttribute("data-state", "filled"); // update data-state

            playerTargetHistory[rowIndex][colIndex] = 'O'; // else mark player target history array with miss
        }
    }

    // Helper function to randomly generate computers move
    function generateComputerMove() {
        let rowIndex; // variable to store row index of computer generated move
        let colIndex; // variable to store column index of computer generated move
        let shipType = ''; // if previous move was hitting a ship not yet sunk, store string variable of ship name
        let hitShip; // variable to store object from array of ships of ship that was hit

        // if computer isn't currently in process of sinking a found ship, generate row and column for random move
        if (!computerHitNotSunk){
            let isEven = Math.random() < 0.5; // randomly generate boolean value for either true or false
            // Generate random number between 0 and 13, made even or odd based on result of isEven
            rowIndex =  (Math.floor(Math.random() * (arrayLength / 2)) * 2 + (isEven ? 0 : 1));
            colIndex =  (Math.floor(Math.random() * (arrayLength / 2)) * 2 + (isEven ? 0 : 1));
        }
        
        // if computer is currently in process of sinking found ship, find next move
        if (computerHitNotSunk){
            // get name of ship being sunk 
            const lastMoveId = 'player-cell-' + computerLastMoveHitRow + '-' + computerLastMoveHitCol;
            const lastMoveElement = document.getElementById(lastMoveId); // Get HTML element using the ID
            shipType = getShipType(lastMoveElement); // call function to get ship type
            // Get the ship object from the array using shipType
            hitShip = shipsArray.find(ship => ship.name === shipType);

            // Calculate row and column offsets for surrounding cells
            const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];

            // loop through combination of offset values either going up, down, left or right from last computer hit
            for (const [rowOffset, colOffset] of offsets) {
                // Call recurive function, looping through offset combos of up, down, left and right to check for another hit value
                const [tempRowIndex, tempColIndex] = getShipEnd(computerLastMoveHitRow, computerLastMoveHitCol, hitShip, rowOffset, colOffset, 0); 
                // if the returned row and column is not false (aka found a cell)
                if (tempRowIndex !== false && tempColIndex !== false){
                    rowIndex = tempRowIndex; // store row and column into variables to update board
                    colIndex = tempColIndex;
                    break; // break loop of offset combos and continue to mark move
                }
            }
        }

         // check if cell clicked was already selected
        if (computerTargetHistory[rowIndex][colIndex] === 'X' || computerTargetHistory[rowIndex][colIndex] === 'O'){
            return generateComputerMove(); // call function again to generate new move
        }

        // get ID of Players board HTML Element of next computer move found, either random or sinking ship
        const computerHitId = "player-cell-" + rowIndex + "-" + colIndex; // concatenate string to get id of HTML Element
        const computerHitTarget = document.getElementById(computerHitId); // get players board cell HTML Element

        // if first hit of the ship
        if (!computerHitNotSunk){
            shipType = getShipType(computerHitTarget); // call function to get shipType
            // Get the ship object from the array using shipType
            hitShip = shipsArray.find(ship => ship.name === shipType);
        }
            
        // check if cell clicked was has hit players ship and hasn't already been hit
        if (playerShipLocations[rowIndex][colIndex].status === 'X' && computerHitTarget.dataset.state !== 'filled'){
            // update HTML element with hit color 
            computerHitTarget.classList.add('ship-hit'); // update HTML class to update styling
            computerHitTarget.setAttribute("data-state", "filled"); // update data-state

            computerTargetHistory[rowIndex][colIndex] = 'X'; // mark player target history array with hit

            computerHitNotSunk = true; // set computerHit but not sunk to true to skip random generation of move
            computerLastMoveHitRow = rowIndex; // store location of last hit move row
            computerLastMoveHitCol = colIndex; // store location of last hit move column

            // update hit count of ship object
            hitShip.hitCount = hitShip.hitCount + 1;

            // if the updated hitCount hit the last position of ship
            if (hitShip.hitCount === hitShip.shipSize){
                computerHitNotSunk = false; // reset to false so randomly generated moves will start again
                computerLastMoveHitRow = undefined; // reset last hit move
                computerLastMoveHitCol = undefined; // reset last hit move

                // call function to generate flash message
                handleFlashMessage('computer', hitShip.name);
            }
        }
        else if (playerShipLocations[rowIndex][colIndex].status === '-') { // ensure location is empty
            // update HTML element with miss color 
            computerHitTarget.classList.add('ship-missed'); // update HTML class to update styling
            computerHitTarget.setAttribute("data-state", "filled"); // update data-state

            computerTargetHistory[rowIndex][colIndex] = 'O'; // else mark player target history array with miss
        }
    }

    // helper function to get shipType when generating computers move
    function getShipType(element){
        let shipType = '';
        const classNames = element.className.split(' '); // split class names by space
            // loop through each word
            classNames.forEach(className => {
                // if current class name word, isn't cell or player-cell, than it is the ship's name
                if (className !== 'cell' && className !== 'player-cell' && className !== 'ship-hit') {
                    shipType = className; // store ship type
                }
            });
        return(shipType); // return found shipType
    }

    // recursive function to find the opposite end of the ship
    function getShipEnd(rowIndex, colIndex, hitShip, rowOffset, colOffset, lengthCount){
        const newRow = rowIndex + rowOffset; // calculate row number utilizing offset
        const newCol = colIndex + colOffset; // calculate column number utilizing offset   

        if (newRow > 13 || newRow < 0 || newCol > 13 || newCol < 0){
            return [false, false]; // break recursion, not valid, out of bounds of board
        }

        const elementId = `player-cell-${Number(rowIndex + rowOffset)}-${Number(colIndex + colOffset)}`;
        const element = document.getElementById(elementId); // Get HTML element using the ID

        const nextCellShipType = getShipType(element);

        // base case, cell is a players ship location, hasn't already been hit, and is the same ship that was hit
        if ((playerShipLocations[newRow][newCol].status === 'X' && element.dataset.state !== 'filled' && 
            hitShip.name === nextCellShipType)){
            return [newRow, newCol]; // return found cell
        }
        else{ 
            lengthCount = lengthCount + 1; // increment length count
            // if iteration of recursion goes past length of the ship, haven't found valid spot
            if (hitShip.length === lengthCount){
                return [false, false]; // break recursion, not valid
            }

            // Return the result of the recursive call
            // recur to move to next space
            return getShipEnd(newRow, newCol, hitShip, rowOffset, colOffset, lengthCount);
        }
    }

    // function to check if winner
    function checkWinner(){
        let playerHitCounter = 0; // variable to count number of hits for player
        let computerHitCounter = 0; // variable to count number of hits for computer
        const magicHitCount = 27; // variable that stores number of hits to win the game

        // loop through boards and count number hits to see if there is a winner
        for (let i = 0; i < arrayLength; i++){
            for(let k = 0; k < arrayLength; k++){
                // if hit has occurred
                if (playerTargetHistory[i][k] === 'X'){
                    playerHitCounter++; // increment hitCounter
                }
                // if hit has occurred
                if (computerTargetHistory[i][k] === 'X'){
                    computerHitCounter++; // increment hitCounter
                }
            }
        }

        // Check if player hit count won the game
        if (playerHitCounter === magicHitCount){
            return 'player';
        }
        // else if check if computer hit count won the game
        else if (computerHitCounter === magicHitCount){
            return 'computer';
        }
        // else return null
        else{
            return;
        }
    }

    // Helper function to handle rest button click
    function handleResetButton() {
        location.reload(); // reload the page to reset
    }

    // function to handle flash messages
    function handleFlashMessage(player, ship){
        // if ship is sunk
        if (ship){
            // if player is player
            if (player === 'player') {
                playerFlashMessage.textContent = "You sunk the computers " + ship + "!"
                handleMessage(playerFlashMessage); // call function to fade message away
            }

            // else if player is computer
            else if (player === 'computer'){
                computerFlashMessage.textContent = "The computer sunk your " + ship + "!"
                handleMessage(computerFlashMessage); // call function to fade message away
            }
        }

        else if (!ship){
            // if player is player
            if (player === 'player') {
                playerFlashMessage.textContent = "Congratulations! You beat the computer!"
                handleMessage(playerFlashMessage); // call function to fade message away
            }

            // else if player is computer
            else if (player === 'computer'){
                computerFlashMessage.textContent = "The computer beat you :( AI is taking over the word"
                handleMessage(computerFlashMessage); // call function to fade message away
            }
        }
    }

    // JQuery Helper function to hide flash message after 5 seconds
    function handleMessage(flashMessage) {
        // Show the message
        $(flashMessage).fadeIn();

        // Set a timer to wait 2.5 seconds before fading
        setTimeout(() => {
          // Use jQuery `fadeOut` animation (requires Bootstrap JS included)
          $(flashMessage).fadeOut(500, () => {
            // Hide the element after fade is complete
            flashMessage.style.display = 'none';
          });
        }, 2000); // Set timeout to 2.5 seconds
      }
});