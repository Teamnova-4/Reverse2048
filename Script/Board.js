import { Tile } from './main.js';

let clickMode = "insertMode";
let insertTile;

let turn
let CurrentGameState;

let gridSize = 4;
let board; 

let BestMove;

let timer;
//스킬 변수
let playerSkill = "bomb";
let playerSkillCoolTime = 1;
let coolTime = 0;

let isDouble = false;
let isMindControl = false;
/**
 * 플레이어 가 스페이스 바를 눌렀을떄 실행되고 각자
 * 다른 실행방식이 있다 
 * 현제 기간이 길지 않고
 * 스킬 개수의 증가 가능성이 0에 수렴하다 보니
 * 스파게티 코드 형식으로 만들겠다
 * 
 */
document.addEventListener("keydown", (event)=>{
    if (CurrentGameState === "Control" && event.key === " "){
        if(coolTime === 0){
            coolTime = playerSkillCoolTime;
            UseSkill();
        } else {
            console.log(`coolTime : ${coolTime}`);
        }
    }
});

function startGame(){

    initSkill();
    initBoard();
}

function initSkill() {

}
function DrawBoard(){
    board.forEach((row) => {
        row.forEach((tile) => {
            tile.assignValue();
        });
    });
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
            cell.addEventListener("click", () => {
                if (clickMode === "insertMode"){
                    placeTile(board[r][c])
                } else if (clickMode === "skillMode"){
                    UseSkillToTile(board[r][c]);
                }
            });
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
        case"FinishTurn":
            finishTurn();
            break
        case "End":
            break;
    }
    DrawBoard();
}

function finishTurn(){
    turn += 1;
    if (coolTime > 0) {coolTime -= 1;}
    setCurrentState("Control");
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
    if ( tile.value === null && CurrentGameState === "Control") {
        tile.insertTile(insertTile);
        if (isDouble) {
            isDouble = false;
        } else {
            setCurrentState("FinishControl");
        }
    }
}


function simulate() {
    const directions = ["up", "down", "left", "right"];
    let maxMergeScore = 0;
    let bestMoves = [];
    let minMergeScore = Number.MAX_VALUE;
    let mostBedMove;

    directions.forEach(direction => {
        let tempBoard = board.map(row => [...row]);
        let tempScore = 0;
        tempScore = simulateDirection(tempBoard, direction);
        if(tempScore < minMergeScore && tempScore >= 0){
            mostBedMove = direction;
            minMergeScore = tempScore;
        }
        if (tempScore > maxMergeScore) {
            maxMergeScore = tempScore;
            bestMoves = [direction];
        } else if (tempScore === maxMergeScore) {
            bestMoves.push(direction);
        }
    });

    if (bestMoves.length > 0) {
        BestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        if (isMindControl){
            BestMove = mostBedMove;
        }
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

    setCurrentState("FinishTurn");
}


function endGame(){

}

function explodeTile(tile){
    const minX = Math.max(tile.x - 1, 0);
    const minY = Math.max(tile.y - 1, 0);
    const maxX = Math.min(tile.x + 1, gridSize - 1);
    const maxY = Math.min(tile.y + 1, gridSize - 1);
    console.log(`center x: ${tile.x}, center y: ${tile.y}`);
    console.log(`minX: ${minX}, minY: ${minY}, maxX: ${maxX}, maxY: ${maxY}`);

    console.log(board);
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            console.log(board[y][x]);
            board[y][x].value = null;
        }
    }
    tile.value = null;
    console.log("Bomb explode");

    DrawBoard();
}

function UseSkillToTile(tile){
    if ( tile.value === null && CurrentGameState === "Control") 
        return;

    switch (playerSkill) {
        case "shield":
            // 선택필요 스킬
            tile.value.isShield = true;
            break;
        case "fix":
            tile.value.isFixed = true;
            // 선택필요 스킬
            break;
        case "double":
            tile.value.value *= 2;
            break;
        default:
    }
    clickMode = "insertMode";
    DrawBoard();
}

//스킬 사용 함수
function UseSkill() {
    switch (playerSkill) {
        case "zeroTile":
            insertTile = 0;
            break;
        case "shield":
            // 선택필요 스킬
            clickMode = "skillMode";
            break;
        case "fullShield":
            board.forEach(row => { 
                row.forEach(tile => { 
                    if (tile.value !== null){
                        tile.value.isShield = true; 
                    }
                });
            });
            break;
        case "bomb":
            insertTile = "bomb";
            break;
        case "fix":
            // 선택필요 스킬
            clickMode = "skillMode";
            break;
        case "mindControl":
            // 선택필요 스킬
            isMindControl = true;
            break;
        case "double":
            // 선택필요 스킬
            break;
        case "sequence":
            isDouble = true;
            break;
        default:
    }
    DrawBoard();
}

function reduceCoolTime(){
    coolTime -= 1;
}
function setSkill(param1, param2) {
    playerSkill = param1;
    playerSkillCoolTime = param2;
}
export { setCurrentState, explodeTile, DrawBoard };
export { CurrentGameState };