import { Tile } from './main.js';

let skill;
let insertTile;

let turn
let CurrentGameState;

let gridSize = 4;
let board; 

let BestMove;

let timer;

document.addEventListener("keydown", (event)=>{
    console.log( event.key );
    if (CurrentGameState === "Control" && event.key === "space"){
        //스킬 사용코드
    }
});

function startGame(){

    initSkill();
    initBoard();
}

function initSkill() {

}
function initBoard() {
    board = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(0));
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = document.createElement("div");
            cell.className = "tile";
            board[r][c] = new Tile(r, c, cell); 
            cell.addEventListener("click", () => placeTile(board[r][c]));
            grid.appendChild(cell);
        }
    }
}

function setCurrentState(state) {
    CurrentGameState = state;
    console.log(CurrentGameState);
    switch(CurrentGameState) {
        case "Start":
            initBoard();
            setCurrentState("Control");
            break;
        case "Control":
            timer = startTimer();
            insertTile = Math.random() < 0.9 ? 2 : 4;
            break;
        case "FinishControl":
            clearInterval(timer);
            setTimeout(() => {setCurrentState("Simulate")},1000);
            break;
        case "Simulate":
            simulate()
            break;
        case "Move":
            move();
            break;
        case "End":
            turn += 1;
            break;
    }
}

function drawBoard(){

}

function getTile (r, c) {

}

function startTimer(){
    showHtmlTimeCount(0);
    let countTime = 0;
    let timer = setInterval(() => {
        countTime++;

        // 1초마다 event3 실행
        showHtmlTimeCount(countTime);

        if ( (countTime % 6) == 0 ) {
            //console.log("6초마다 event3 실행");
        } 
    }, 1000);
    return timer;
}

function showHtmlTimeCount(countTime){
    //console.log("ShowHtmlTimeCOunt " + countTime);
}

function placeTile(tile){
    if (CurrentGameState === "Control") {
        tile.insertTile(insertTile);
        setCurrentState("FinishControl");
    }
}


function simulate() {
    const directions = ["up", "down", "left", "right"];
    let maxMergeScore = 0;
    let bestMoves = [];

    directions.forEach(direction => {
        let tempBoard = board.map(row => [...row]);
        let tempScore = 0;
        tempScore = simulateDirection(tempBoard, direction);
        console.log(`${direction} score: ${tempScore}`);
        if (tempScore > maxMergeScore) {
            maxMergeScore = tempScore;
            bestMoves = [direction];
        } else if (tempScore === maxMergeScore) {
            bestMoves.push(direction);
        }
    });

    if (bestMoves.length > 0) {
        BestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        console.log("Best Move: ", BestMove);
        setCurrentState("Move");
    } else {
        console.log("No valid moves");
        setCurrentState("End");
    }
}


function simulateDirection(tempBoard, direction) {
    let tempScore = 0;
    Tile.isChanged = false;
    for (let i = 0; i < gridSize; i++) {
        let line = [];
        if (direction === 'up' || direction === 'down') {
            line = tempBoard.map(row => row[i]);
        } else {
            line = tempBoard[i];
        }

        if(direction === 'right' || direction === 'down'){
            line.reverse();
        }

        tempScore += Tile.simulateMergeList(line);
    }
    return Tile.isChanged ? tempScore : -1;
}

function move() {
    for (let i = 0; i < gridSize; i++) {
        let line = [];
        if (BestMove === 'up' || BestMove === 'down') {
            line = board.map(row => row[i]);
        } else {
            line = board[i];
        } 
        if (BestMove === 'right' || BestMove === 'down') { line.reverse(); }
        line = Tile.mergeList(line);
        if (BestMove === 'right' || BestMove === 'down') { line.reverse(); }
    }

    setCurrentState("Control");
}


function endGame(){

}

export { setCurrentState };
export { CurrentGameState };