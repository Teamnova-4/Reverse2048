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
let playerSkillCoolTime;
setSkillCoolTime();
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

function assignSkillMode(isSkillMode = true) {
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const tile = board[r][c];
            if (isSkillMode) {
                tile.div.classList.add("tile-skill-mode");
                tile.div.classList.remove("tile");
            } else {
                tile.div.classList.remove("tile-skill-mode");
                tile.div.classList.add("tile");
            }
        }
    }
}

function clickSkill() {
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

            const grid = document.getElementById("grid");
            grid.classList.remove("mind-control");

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
            // gameEnding();
            break
        case "End":
            gameEnding();
            break;
    }
    DrawBoard();
}

function gameEnding() {
    console.log('게임이 끝났습니다!');
    // 게임 플레이시간 데이터
    const formattedTime = updateGameTimeDisplay()
    console.log('turn값을 받아옵니다 ' + turn);
    console.log('게임플레이시간을 받아옵니다1 : ' + updateGameTimeDisplay());
    // 클리어모달(화면)
    showGameClearModal(turn, formattedTime);
}

async function sendRankingData(nickname, turn, formattedTime) {

    try {
        console.log('게임플레이시간을 받아옵니다2 : ' + updateGameTimeDisplay());
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

// "Submit" 버튼 클릭 이벤트 처리: 닉네임 가져와서 sendRankingData 호출
document.getElementById('submit-nickname').addEventListener('click', () => {
    const nickname = document.getElementById('nickname-input').value;
    if (nickname) {
          // 유효성 검사
    if (!nickname) {
        alert("닉네임을 입력해주세요.");
    } 
    else if (/\s/.test(nickname)) { // 공백(스페이스바) 포함 여부 검사
        alert("닉네임에는 공백을 포함할 수 없습니다.");
    }
    else if (getByteLength(nickname) > 32) {
        alert("닉네임은 한글 최대 16자, 영어/숫자/특수문자 최대 32자까지 입력 가능합니다.");
    } 
    else {
        sendRankingData(nickname, turn, updateGameTimeDisplay());
        document.getElementById('submit-nickname').disabled = true;
        document.getElementById('nickname-input').style.display = 'none';
        document.getElementById('submit-nickname').style.display = 'none';
    }
    } else {
        alert("닉네임을 입력해주세요."); // 닉네임 입력 안했을 때 알림
    }
});

// 닉네임의 바이트 길이를 계산하는 함수
function getByteLength(str) {
    let byteLength = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        // 한글은 2바이트, 영어는 1바이트로 처리
        byteLength += (char > 128) ? 2 : 1;
    }
    return byteLength;
}

// 게임 클리어 모달 표시 (이름 변경, 칭찬 문구 수정)
function showGameClearModal(turns, time) {
    document.getElementById('final-turns').textContent = turns;
    document.getElementById('final-time').textContent = time;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

// 타이틀 이동 버튼튼 -> 
document.getElementById('go_title_1').addEventListener('click', () => {
    document.getElementById('game-over-screen').classList.add('hidden');  // ID 변경
    window.location.href = `ChoiseMode.html`;
});

// (선택 사항) 모달 바깥 클릭 시 닫기
window.addEventListener('click', (event) => {
    if (event.target.id === 'game-over-screen') { // ID로 확인
        event.target.classList.add('hidden');
        window.location.href = `ranking.html`;
    }
});

// 이벤트 리스너 추가
document.addEventListener("DOMContentLoaded", function () {
    // 게임 종료 시 showGameClearScreen()을 호출하도록 이벤트 트리거 추가
    document.getElementById("go_title_1").addEventListener("click", function () {
        // 다시 시작 버튼 클릭 시 화면 숨기기
        document.getElementById("game-over-screen").classList.add("hidden");
    });
});
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
    playSound("emergency");
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
            isMindControl = false;
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
    assignSkillMode(false);
    clickMode = "insertMode";
    if (tile.value === null && CurrentGameState === "Control") {
        coolTime = 0;
        updateCooltime();
        return;
    }

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
            assignSkillMode();
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
            assignSkillMode();
            break;
        case "mindControl":
            const grid = document.getElementById("grid");
            grid.classList.add("mind-control");
            isMindControl = true;
            break;
        case "double":
            // 선택필요 스킬
            clickMode = "skillMode";
            assignSkillMode();
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

function setSkillCoolTime() {
    switch (playerSkill) {
        case 'zeroTile':
            playerSkillCoolTime = 12;
            break;
        case 'timeAmplification':
            playerSkillCoolTime = 8;
            break;
        case 'shield':
            playerSkillCoolTime = 10;
            break;
        case 'fullShield':
            playerSkillCoolTime = 30;
            break;
        case 'bomb':
            playerSkillCoolTime = 1;
            break;
        case 'fix':
            playerSkillCoolTime = 5;
            break;
        case 'mindControl':
            playerSkillCoolTime = 15;
            break;
        case 'double':
            playerSkillCoolTime = 8;
            break;
        case 'sequence':
            playerSkillCoolTime = 10;
            break;
        case '미선택':
            playerSkillCoolTime = 0;
            break;
        default :
            playerSkillCoolTime = 1;
            break;
    }
}

export { CurrentGameState, DrawBoard, explodeTile, setCurrentState };

