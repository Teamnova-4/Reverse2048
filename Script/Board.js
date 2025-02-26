import { Tile } from './main.js';
import { playSound } from './Sound.js';

let clickMode = "insertMode";
let insertTile;

let turn = 0;
let CurrentGameState;

let gridSize = parseInt(localStorage.getItem('gameSize'));
let board;

let BestMove;

const baseLimitTime = 6;
let timer;
let limitTime = baseLimitTime;
let gameTime = 0;
let gameTimer;

//스킬 변수
let playerSkill = localStorage.getItem('gameSkill');
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
document.addEventListener("keydown", (event) => {
    if (CurrentGameState === "Control" && event.key === " ") {
        clickSkill();
    }
});

function clickSkill(){
    if (coolTime === 0) {
        coolTime = playerSkillCoolTime;
        UseSkill();
    } else {
        console.log(`coolTime : ${coolTime}`);
    }
}


function startGame() {
    setGridSize();
    initSkill();
    initBoard();
}

function initSkill() {

}
function DrawBoard() {
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
                if (clickMode === "insertMode") {
                    placeTile(board[r][c])
                } else if (clickMode === "skillMode") {
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
    switch (CurrentGameState) {
        case "Start":
            setGridSize();
            startGameTimer();
            initBoard();
            setCurrentState("Control");
            break;
        case "Control":
            timer = startTimer();
            insertTile = Math.random() < 0.9 ? 2 : 4;
            document.getElementById('next').innerText = insertTile;
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
            break
        case "End":
            break;
    }
    DrawBoard();
}

function gameEnding() {
    console.log('게임이 끝났습니다!');
    const nickname = prompt("닉네임을 입력하세요:");
    if (nickname) {
        const formattedTime = updateGameTimeDisplay()

        console.log('닉네임이 입력되었습니다 ' + nickname);
        console.log('turn값을 받아옵니다 ' + turn);
        console.log('게임플레이시간을 받아옵니다1 : ' + formattedTime);

        sendRankingData(nickname, turn, formattedTime); //  시간은 countTime
    }
}

async function sendRankingData(nickname, turn, formattedTime) {

    try {
        console.log('게임플레이시간을 받아옵니다2 : ' + formattedTime);
        const response = await fetch('./php/save_ranking.php', { // 경로 수정
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nickname, turn, formattedTime })
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
    // 턴 증가
    turn += 1;
    limitTime = baseLimitTime;
    document.getElementById("turn").innerText = turn;
    // 쿨타임 감소
    if (coolTime > 0) {
        coolTime -= 1;
        updateCooltime();
    }
    // 다음 턴 준비
    setCurrentState("Control");
}

function startTimer() {
    showHtmlTimeCount(0);
    let countTime = 0;
    let timer = setInterval(() => {
        countTime++;

        // 1초마다 event3 실행
        showHtmlTimeCount(countTime);

        if ((countTime % limitTime) == 0) {
            divideAllTileByNumber();
        }
    }, 1000);
    return timer;
}

function divideAllTileByNumber() {
    board.forEach(line => {
        line.forEach(tile => {
            const value = tile.value;
            if (value !== null) {
                if (value.value === "bomb") {
                    explodeTile(tile);
                } else if (value.isFixed || value.isShield) {
                    value.isFixed = false;
                    value.isChanged = false;
                } else {
                    if (value.value === 2 || value.value === 0) {
                        // 2인 타일은 제거
                        tile.value = null;
                    } else {
                        value.value = Math.floor(value.value / 2);
                        console.log(value.value);
                    }
                } 
            }
        });
    });
    DrawBoard();
}

function showHtmlTimeCount(countTime) {
    //console.log("ShowHtmlTimeCOunt " + countTime);
    // 턴마다 6초 제한 표시
    // 6초에서 카운트다운 되는 형식으로 제한시간 표시
    let remainingTime = limitTime - countTime % limitTime;
    document.getElementById('limit').innerText = remainingTime;

};

function placeTile(tile) {
    if (tile.value === null && CurrentGameState === "Control") {
        playSound('place');
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
        if (tempScore < minMergeScore && tempScore >= 0) {
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
        if (isMindControl) {
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

        if (direction === 'right' || direction === 'down') {
            line.reverse();
        }

        tempScore += Tile.simulateMergeList(line);
    }
    return Tile.isChanged ? tempScore : -1;
}

function move() {
    playSound('move');
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

function explodeTile(tile) {
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

function UseSkillToTile(tile) {
    if (tile.value === null && CurrentGameState === "Control")
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
            document.getElementById('next').innerText = insertTile;
            break;
        case "timeAmplification":
            limitTime = 15;
            break;
        case "shield":
            // 선택필요 스킬
            clickMode = "skillMode";
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
            clickMode = "skillMode";
            break;
        case "mindControl":
            isMindControl = true;
            break;
        case "double":
            // 선택필요 스킬
            clickMode = "skillMode";
            break;
        case "sequence":
            isDouble = true;
            break;
        default:
    }
    DrawBoard();
    updateCooltime();
}

function reduceCoolTime() {
    coolTime -= 1;
}
function setSkill(param1, param2) {
    playerSkill = param1;
    playerSkillCoolTime = param2;
}


function startGameTimer() {
    if (gameTimer) clearInterval(gameTimer);

    gameTimer = setInterval(() => {
        gameTime++;
        updateGameTimeDisplay();
    }, 1000);
}

function updateGameTimeDisplay() {
    let minute = Math.floor(gameTime / 60);
    let second = gameTime % 60;
    minute = minute < 10 ? "0" + minute : minute;
    second = second < 10 ? "0" + second : second;
    document.getElementById('time').innerText = minute + ":" + second;
    // console.log('minute: ' + minute);
    // console.log('second: ' + second);
    let timeString = minute + ":" + second;

    return timeString;
}

function updateCooltime() {
    const overlay = document.getElementById('cooltimeOverlay');
    const cooltimeSpan = document.getElementById('cooltime');

    if (coolTime > 0) {
        overlay.classList.add('active');
        cooltimeSpan.textContent = coolTime;
    } else {
        overlay.classList.remove('active');
    }
}

function setGridSize() {
    const grid = document.getElementById('grid');
    const baseSize = 420; // 4x4 기준의 그리드 전체 크기 (padding 제외)
    const tileSize = Math.floor((baseSize - (10 * (gridSize - 1))) / gridSize); // gap 10px 고려
    
    // 그리드 템플릿 설정
    grid.style.gridTemplateColumns = `repeat(${gridSize}, ${tileSize}px)`;
    grid.style.gridTemplateRows = `repeat(${gridSize}, ${tileSize}px)`;
    
    // 전체 그리드 크기는 4x4 기준으로 고정
    grid.style.width = `${baseSize}px`;
    grid.style.height = `${baseSize}px`;
    
    // 타일 크기 동적 조정을 위한 CSS 변수 설정
    document.documentElement.style.setProperty('--tile-size', `${tileSize}px`);
}

export { CurrentGameState, DrawBoard, explodeTile, setCurrentState };

