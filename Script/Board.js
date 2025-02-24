
let skill;
let gridSize = 4;
let board; 
let playerClickMode = "";

function startGame(){

    initSkill();
    initBoard();
    gameLoop();
}

function initSkill() {

}
function initBoard() {
    board = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(0));
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            let cell = document.createElement("div");
            cell.className = "cell";
            cell.textContent = board[r][c] || "";
            cell.addEventListener("click", () => placeTile(r, c));
            grid.appendChild(cell);
        }
    }
}

function gameLoop() {
    gameLoop();
}

function drawBoard(){

}

function getTile (r, c) {

}

/**
 * 사용자가 타일을 선택할경우 호출되는 메서드
 * 
 * 이 이벤트는 2가지 경우로 사용될수있다.
 * 스킬을 사용할떄, 숫자를 배치할떄
 * 
 * 또한 사용 불가능한 경우의 수가 있다.
 * 이동중이나 어떠한 이유로 플레이어가 클릭하지 못할때
 * 
 * 이것을 playerClickMode으로 판단한다.
 * 그리고 
 * 
 * skill 일경우 스킬은 사용한다. 
 * @param {*} tile 
 */
function clickTile (tile){
    switch(playerClickMode){
        case "skill":

            break;
        case "insert":
            break;
        default:
            break;
    }
}

function placeTile(r, c){

}


function endGame(){

}