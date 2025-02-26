import { Tile } from './main.js';

let insertTile;

let turn = 0;
let CurrentGameState;

let gridSize = 4;
let board;

let BestMove;
let countTime = 0;
let timer;

let startTime = 0; // 게임 시작 시간을 저장할 변수
//스킬 변수
let playerSkill = "fullShield";
let playerSkillCoolTime = 1;
let coolTime = 0;
/**
 * 플레이어 가 스페이스 바를 눌렀을떄 실행되고 각자
 * 다른 실행방식이 있다 
 * 현제 기간이 길지 않고
 * 스킬 개수의 증가 가능성이 0에 수렴하다 보니
 * 스파게티 코드 형식으로 만들겠다
 * 
 */
document.addEventListener("keydown", (event) => {
    if (CurrentGameState === "Control" && event.key === " ") {
        if (coolTime === 0) {
            coolTime = playerSkillCoolTime;
            UseSkill();
        } else {
            console.log(`coolTime : ${coolTime}`);
        }
    }
});

function startGame() {
    initSkill();
    initBoard();
}

function initSkill() {

}
function DrawBoard() {
    if (!board) { // board가 undefined 또는 null이면 함수 실행 중단
        console.error("DrawBoard: board is not initialized!");
        return;
    } else {
        board.forEach((row) => {
            row.forEach((tile) => {
                tile.assignValue();
            });
        });
    }
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
    switch (CurrentGameState) {
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
            setTimeout(() => { setCurrentState("Simulate") }, 1000);
            break;
        case "Simulate":
            simulate()
            break;
        case "Move":
            move();
            break;
        case "FinishTurn":
            finishTurn();
            gameEnding();
            break;
        case "End":
            break;
    }
    DrawBoard();
}
// 밀리초를 "분:초:밀리초" 형식으로 변환하는 함수
function formatMilliseconds(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const millis = milliseconds % 1000;

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    const formattedMillis = String(millis).padStart(3, '0'); // 밀리초는 3자리

    return `${formattedMinutes}:${formattedSeconds}:${formattedMillis}`;
}
function gameEnding() {
    console.log('게임이 끝났습니다!');
    const nickname = prompt("닉네임을 입력하세요:");
    if (nickname) {

        const endTime = Date.now(); // 게임 종료 시간
        const elapsedTime = endTime - startTime; // 밀리초 단위 플레이 시간
        const playTime = formatMilliseconds(elapsedTime); // "분:초:밀리초" 형식으로 변환

        console.log('닉네임이 입력되었습니다 ' + nickname);
        console.log('turn값을 받아옵니다 ' + turn);
        console.log('게임플레이시간을 받아옵니다 ' + playTime);

        sendRankingData(nickname, turn, playTime); //  시간은 countTime
    }
}

async function sendRankingData(nickname, turn, playTime) {

    try {
        const response = await fetch('./php/save_ranking.php', { // 경로 수정
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nickname, turn, playTime })
        });

        const data = await response.json();

        if (data.success) {
            console.log('랭킹 데이터 저장 성공');
            // 랭킹 테이블을 새로고침 (ranking.js에 loadRankings 함수가 있어야 함)
            window.location.href = `ranking.html`;
        } else {
            console.error('랭킹 데이터 저장 실패:', data.message);
            alert(`데이터 저장 실패: ${data.message}`);
        }
    } catch (error) {
        console.error('랭킹 데이터 전송 중 오류 발생:', error);
        alert('데이터 전송 중 오류 발생:', error);
    }
}

function finishTurn() {
    // 턴 끝날때마다 +1씩
    turn += 1;
    if (coolTime > 0) { coolTime -= 1; }
    updateTurnDisplay();
    setCurrentState("Control");
}
// 보드판의 턴 화면에 숫자표시
function updateTurnDisplay() {
    const turnElement = document.getElementById("turn");
    if (turnElement) {
        console.log('turn값을 가져왔습니다 :' + turn);
        turnElement.innerText = turn;
    } else {
        console.log('turn - html값을 가져오지 못했습니다.');
    }
}

function startTimer() {
    showHtmlTimeCount(0);

    let timer = setInterval(() => {
        countTime++;

        // 1초마다 event3 실행
        showHtmlTimeCount(countTime);

        if ((countTime % 6) == 0) {
            //console.log("6초마다 event3 실행");
        }
    }, 1000);
    return timer;
}

function showHtmlTimeCount(countTime) {
    // console.log("ShowHtmlTimeCOunt " + countTime);
    // console.log("PlayTime: " + countTime);
}

function placeTile(tile) {
    if (tile.value === null && CurrentGameState === "Control") {
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
        // 게임 종료
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

        if (direction === 'right' || direction === 'down') {
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


function endGame() {

}

//스킬 사용 함수
function UseSkill() {
    switch (playerSkill) {
        case "zeroTile":
            insertTile = 0;
            break;
        case "shield":
            // 선택필요 스킬
            break;
        case "fullShield":
            board.forEach(row => {
                row.forEach(tile => {
                    if (tile.value !== null) {
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
            break;
        case "mindControl":
            // 선택필요 스킬
            break;
        case "double":
            // 선택필요 스킬
            break;
        case "sequence":
            // 기존 시스탬 변경필요 
            break;
        default:
    }
    DrawBoard();
}

function reduceCoolTime() {
    coolTime -= 1;
}
function setSkill(param1, param2) {
    playerSkill = param1;
    playerSkillCoolTime = param2;
}
export { setCurrentState };
export { CurrentGameState };