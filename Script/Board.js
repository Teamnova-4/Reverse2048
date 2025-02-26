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
 * 현제 기간이 길지 않고`
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
    console.log("DrawBoard 호출");
    // board.forEach((row) => {
    //     row.forEach((tile) => {
    //         tile.assignValue();
    //     });
    // });
}

/**
 * 게임 보드를 초기화하는 함수
 */
function initBoard() {
    board = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(0));
    const grid = document.getElementById("grid");

    grid.innerHTML = ""; // 기존 게임 보드를 지웁니다.

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {

            // 그리드에 빈칸 생성
            const cell = document.createElement("div");
            cell.className = "cell";

            // div 태그 별로 자신의 좌표 기록
            cell.dataset.row = r;
            cell.dataset.col = c;

            // 타일 클릭 이벤트 리스너를 추가합니다.
            cell.addEventListener("click", (e) => {
                if (clickMode === "insertMode") { // 클릭 모드가 "insertMode"이면
                    // 클릭된 빈칸의 그리드 좌표 가져오기
                    const clickedCell = e.currentTarget;
                    placeTile(clickedCell); // 타일 배치
                } else if (clickMode === "skillMode") { // 클릭 모드가 "skillMode"이면
                    UseSkillToTile(board[r][c]); // 타일에 스킬 적용
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
            setTimeout(() => { setCurrentState("Simulate") }, 500);
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
            break
        case "End":
            // gameEnding();
            break;
    }
    DrawBoard();
}

function gameEnding() {
    console.log('게임이 끝났습니다!');
    // 게임 플레이시간 데이터
    const formattedTime = updateGameTimeDisplay()
    // 클리어모달(화면)
    showGameClearModal(turn, formattedTime);

}

async function sendRankingData(nickname, turn, formattedTime, gameSize) {

    try {
        const response = await fetch('./php/save_ranking.php', { // 경로 수정
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nickname, turn, formattedTime, gameSize })
        });

        const data = await response.json();

        if (data.success) {
            console.log('[Board.js]랭킹 데이터 저장 성공');
            window.location.href = `ranking.html`;

        } else {
            console.error('[Board.js]랭킹 데이터 저장 실패:', data.message);
            alert(`[Board.js]데이터 저장 실패: ${data.message}`);
        }
    } catch (error) {
        console.error('[Board.js]랭킹 데이터 전송 중 오류 발생:', error);
        alert('[Board.js]데이터 전송 중 오류 발생:', error);
    }
}


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
// 100위권안에 들어가는지 확인합니다.
async function checkrank_DB_userScore(turn, formattedTime) {
    try {
        const response = await fetch('./php/check_ranking.php', { // check_ranking.php 또는 canRegister.php
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ turn: turn, formattedTime: formattedTime })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log('data.count: ' + data.count);
        console.log('data.success: ' + data.success);
        console.log('data.canRegister: ' + data.canRegister);

        if (data.success && data.canRegister) {
            // 순위가 확인이 됬으니 랭크 등록이 가능하다.
            console.log('[Board.js] DB 100위 순위확인성공');
            gameSizeCheck();
            document.getElementById('view-ranking').style.display = 'none';
            // 랭킹등록 버튼 활성화
            document.getElementById('submit-nickname').disabled = false;
            // 닉네임 입력창
            document.getElementById('nickname-input').style.display = 'block';
            // 랭킹등록 버튼
            document.getElementById('submit-nickname').style.display = 'block';
            // "Submit" 버튼 클릭 이벤트 처리: 닉네임 가져와서 sendRankingData 호출
            document.getElementById('submit-nickname').addEventListener('click', () => {
                const nickname = document.getElementById('nickname-input').value;
                // 유효성 검사
                if (!nickname) {
                    alert("닉네임을 입력해주세요.");
                } else if (/\s/.test(nickname)) { // 공백(스페이스바) 포함 여부 검사
                    alert("닉네임에는 공백을 포함할 수 없습니다.");
                } else if (getByteLength(nickname) > 32) {
                    alert("닉네임이 너무 길어요, 조금 줄여주세요!!");
                } else {
                    // 순위가 확인됬으니 db에 저장하자
                    sendRankingData(nickname, turn, updateGameTimeDisplay(), gameSizeCheck());
                }
            });
        } else {
            console.log('[Board.js]DB 순위권 미달 100등이상 : 타이틀로버튼, 랭킹보기버튼 보이기기');
            // 랭킹등록 버튼 활성화
            document.getElementById('submit-nickname').disabled = true;
            // 닉네임 입력창
            document.getElementById('nickname-input').style.display = 'none';
            // 랭킹등록 버튼
            document.getElementById('submit-nickname').style.display = 'none';
            // 랭킹보기 버튼
            document.getElementById('view-ranking').style.display = 'block';
            // 랭킹보기 기능부여(랭크페이지 이동동)
            document.getElementById('view-ranking').addEventListener('click', () => {
                window.location.href = `ranking.html`;
            });
        }
    } catch (error) {
        console.error('[Board.js]DB 100위 순위 데이터 전송 중 오류 발생:', error);
        alert('[Board.js]DB 100위 순위 전송 중 오류 발생:' + error);
        return null; // 실패 시 null 반환
    }
}

function gameSizeCheck() {
    const gameSize = localStorage.getItem('gameSize');
    if (!gameSize) {
        console.error('[Board.js] 게임 크기를 알 수 없음');
        alert('[Board.js] 게임 크기를 알 수 없음');
        return; // 게임 크기를 알 수 없으면 저장 안 함
    } else {
        console.log('[Board.js] 게임 크기: ' + gameSize);
        return gameSize;
    }
}

// 게임 클리어 모달 표시 (이름 변경, 칭찬 문구 수정)
async function showGameClearModal(turns, time) {
    console.log('게임클리어화면시작!');
    document.getElementById('final-turns').textContent = turns;
    document.getElementById('final-time').textContent = time;
    document.getElementById('game-over-screen').classList.remove('hidden');
    console.log('db에서 100위 확인시작!');
    // 게임클리어 화면이 나오고 난 후 db에 100등에 들어가는지 조회합니다.
    checkrank_DB_userScore(turns, time);
}

// 타이틀 이동 버튼 -> 
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

// function placeTile(tile) {
//     if (tile.value === null && CurrentGameState === "Control") {
//         playSound('place');
//         tile.insertTile(insertTile);
//         if (isDouble) {
//             isDouble = false;
//         } else {
//             setCurrentState("FinishControl");
//         }
//     }
// }

/**
 * 빈 칸에 타일을 배치하는 함수입니다.
 * 
 * @param {cell} cell - 타일을 배치할 빈칸 태그
 */
function placeTile(cell) {
    // console.log("placeTile : ", cell);

    // 현재 게임 상태가 "Control" (플레이어의 턴)이고, 선택된 타일이 비어있는 경우에만 타일을 배치합니다.
    if (cell.innerHTML.trim() === "" && CurrentGameState === "Control") {
        // 선택된 타일에 insertTile 변수에 저장된 값(2 또는 4)을 삽입합니다.

        // 주어진 빈칸 태그 내부에 타일 태그 추가
        const tileTag = document.createElement("div");
        tileTag.className = "tile";             // 클래스
        tileTag.innerText = insertTile;     // 사용자에게 보여질 값
        tileTag.dataset.value = insertTile; //  data-value에 저장된 값

        // TODO: 폭탄 스킬을 사용하면 insertTile = "bomb"이 된다. 이에 대응할 것

        cell.appendChild(tileTag);

        // isDouble 변수는 연속 타일 배치 스킬이 활성화되었는지 여부를 나타냅니다.
        // 만약 연속 타일 배치 스킬이 활성화되어 있다면 (isDouble === true)
        // 스킬 효과를 적용한 후 isDouble 변수를 false로 설정합니다.
        if (isDouble) {
            isDouble = false;
        } else {
            // 연속 타일 배치 스킬이 활성화되어 있지 않다면, 
            // setCurrentState 함수를 호출하여 게임 상태를 "FinishControl" (플레이어 턴 종료)로 변경합니다.
            setCurrentState("FinishControl");
        }
    }
}

/**
 * 시스템 턴 (병합 시뮬레이션)을 실행하는 함수입니다.
 * 이 함수는 각 방향(상, 하, 좌, 우)으로 타일을 이동했을 때
 * 예상되는 병합 점수를 계산하고, 그 중 최적의 방향을 선택합니다.
 */
function simulate() {
    const directions = ["up", "down", "left", "right"]; // 가능한 이동 방향들
    let maxMergeScore = 0; // 최대 병합 점수
    let bestMergeMoves = []; // 최고 병합 점수를 가진 방향들
    let possibleMoves = [];  // 이동 가능한 방향들 (병합 없이 단순 이동 포함)

    // 게임 판 정보 배열에 저장
    const gridArray = getCurrentBoard();

    // 각 방향에 대해 시뮬레이션을 진행합니다.
    directions.forEach(direction => {
        const result = simulateDirection(gridArray, direction); // 점수와 이동 가능 여부 반환
        const tempScore = result.score; // 병합 점수
        const canMove = result.canMove; // 이동 가능 여부

        // 병합 점수가 있는 경우
        if (tempScore > 0) {
            if (tempScore > maxMergeScore) {
                maxMergeScore = tempScore;
                bestMergeMoves = [direction]; // 최고 점수 방향으로 갱신
            } else if (tempScore === maxMergeScore) {
                bestMergeMoves.push(direction); // 동일 점수 방향 추가
            }
        }

        // 병합은 없지만 이동 가능한 경우
        if (tempScore === 0 && canMove) {
            possibleMoves.push(direction);
        }
    });

    // 이동 방향 결정
    if (bestMergeMoves.length > 0) {
        // 병합 가능한 방향 중 랜덤 선택
        BestMove = bestMergeMoves[Math.floor(Math.random() * bestMergeMoves.length)];
        console.log("Best Move (merge): ", BestMove);
        setCurrentState("Move");
    } else if (possibleMoves.length > 0) {
        // 병합은 없지만 이동 가능한 방향 중 랜덤 선택
        BestMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        console.log("Best Move (no merge): ", BestMove);
        setCurrentState("Move");
    } else {
        // 이동 불가능한 경우
        console.log("No valid moves");
        setCurrentState("End");
    }
}

// function simulate() {
//     const directions = ["up", "down", "left", "right"];
//     let maxMergeScore = 0;
//     let bestMoves = [];
//     let minMergeScore = Number.MAX_VALUE;
//     let mostBedMove;

//     directions.forEach(direction => {
//         let tempBoard = board.map(row => [...row]);
//         let tempScore = 0;
//         tempScore = simulateDirection(tempBoard, direction);
//         if (tempScore < minMergeScore && tempScore >= 0) {
//             mostBedMove = direction;
//             minMergeScore = tempScore;
//         }
//         if (tempScore > maxMergeScore) {
//             maxMergeScore = tempScore;
//             bestMoves = [direction];
//         } else if (tempScore === maxMergeScore) {
//             bestMoves.push(direction);
//         }
//     });

//     if (bestMoves.length > 0) {
//         BestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
//         if (isMindControl) {
//             isMindControl = false;
//             BestMove = mostBedMove;
//         }
//         console.log("Best Move: ", BestMove);
//         setCurrentState("Move");
//     } else {
//         console.log("No valid moves");
//         setCurrentState("End");
//     }
// }


// function simulateDirection(tempBoard, direction) {
//     let tempScore = 0;
//     Tile.isChanged = false;
//     for (let i = 0; i < gridSize; i++) {
//         let line = [];
//         if (direction === 'up' || direction === 'down') {
//             line = tempBoard.map(row => row[i]);
//         } else {
//             line = tempBoard[i];
//         }

//         if (direction === 'right' || direction === 'down') {
//             line.reverse();
//         }

//         tempScore += Tile.simulateMergeList(line);
//     }
//     return Tile.isChanged ? tempScore : -1;
// }


function simulateDirection(tempBoard, direction) {

    // 디버깅용 예시
    // tempBoard = [
    //     [2, 2, 2, 2],
    //     [null, null, null, null],
    //     [null, null, null, null],
    //     [null, null, null, null]
    // ];
    // console.log("디버깅용 예시");
    // console.log(tempBoard);


    // 병합 점수와 이동 가능 여부를 계산하는 함수
    let tempScore = 0; // 병합으로 얻을 수 있는 점수를 저장
    let canMoveFlag = false; // 해당 방향으로 이동(병합 또는 단순 이동)이 가능한지 여부

    // 각 줄(행 또는 열)을 순회하며 처리
    for (let i = 0; i < gridSize; i++) {
        let line = []; // 현재 처리할 줄을 저장

        // 방향에 따라 줄을 추출: 열(상하) 또는 행(좌우)
        if (direction === 'up' || direction === 'down') {
            // 상하 이동: 열 단위로 추출
            line = tempBoard.map(row => row[i]);
        } else {
            // 좌우 이동: 행 단위로 추출
            line = tempBoard[i];
        }

        // 오른쪽 또는 아래로 이동 시 줄을 뒤집어 병합 방향을 통일
        if (direction === 'right' || direction === 'down') {
            line = line.slice().reverse(); // 원본 보존을 위해 복사 후 뒤집기
        }

        // 병합 시뮬레이션 실행 및 점수 합산
        const mergeResult = simulateMergeList(line);
        // console.log(mergeResult);
        tempScore += mergeResult.score;

        // 이동 가능 여부 확인
        if (mergeResult.score === 0) {
            // 병합이 없으면 단순 이동 가능성 확인
            const originalLine = line.slice(); // 원본 줄 복사
            const movedLine = simulateMoveOnly(line); // 단순 이동 결과
            // 원본과 이동 후가 다르면 이동 가능
            if (JSON.stringify(originalLine) !== JSON.stringify(movedLine)) {
                canMoveFlag = true;
            }
        } else {
            // 병합이 발생하면 이동 가능
            canMoveFlag = true;
        }
    }

    // 결과 출력 및 반환
    // console.log("병합점수: ", tempScore, "이동가능여부: ", canMoveFlag, direction);
    return {
        score: tempScore, // 병합 점수
        canMove: canMoveFlag // 이동 가능 여부
    };
}

// 타일 병합 없이 단순 이동만 시뮬레이션하는 함수
function simulateMoveOnly(line) {
    const result = line.slice(); // 원본 줄 복사
    const filtered = result.filter(val => val !== null); // null 제거
    const padded = [...filtered, ...Array(line.length - filtered.length).fill(null)]; // 빈 공간 null로 채움
    return padded; // 이동 후 결과 반환
}

// function move() {
//     playSound('move');
//     for (let i = 0; i < gridSize; i++) {
//         let line = [];
//         if (BestMove === 'up' || BestMove === 'down') {
//             line = board.map(row => row[i]);
//         } else {
//             line = board[i];
//         }
//         if (BestMove === 'right' || BestMove === 'down') { line.reverse(); }
//         line = Tile.mergeList(line);
//         if (BestMove === 'right' || BestMove === 'down') { line.reverse(); }
//     }

//     setCurrentState("FinishTurn");
// }

/**
 * 현재 게임 보드의 상태를 2차원 배열로 가져오는 함수.
 * 각 셀의 타일 값을 배열에 저장하며, 타일이 없으면 null로 저장합니다.
 * 
 * @returns {Array<Array<number|null>>} - 게임 보드의 현재 상태를 나타내는 2차원 배열.
 *                                         각 요소는 타일의 값(number) 또는 타일이 없는 경우 null입니다.
 */
function getCurrentBoard() {
    const gridArray = Array.from({ length: gridSize }, () => Array(gridSize).fill(null)); // gridSize x gridSize 크기의 2차원 배열을 생성하고 null로 초기화합니다.
    document.querySelectorAll(".cell").forEach(cell => { // 모든 "cell" 클래스를 가진 DOM 요소를 선택하여 반복합니다.
        const row = parseInt(cell.dataset.row); // 현재 셀의 행(row) 인덱스를 가져옵니다.
        const col = parseInt(cell.dataset.col); // 현재 셀의 열(col) 인덱스를 가져옵니다.

        // 만약 cell 내부에 타일이 있다면 값을 저장
        const tile = cell.querySelector(".tile"); // 현재 셀 내부에 "tile" 클래스를 가진 DOM 요소를 찾습니다.
        gridArray[row][col] = tile ? parseInt(tile.dataset.value) : null; // 타일이 있으면 해당 타일의 data-value 값을 정수로 변환하여 gridArray에 저장하고, 타일이 없으면 null을 저장합니다.
    });
    return gridArray; // 생성된 2차원 배열을 반환합니다.
}

function move() {
    playSound('move'); // 이동 사운드를 재생합니다.
    const grid = getCurrentBoard(); // 현재 게임 보드 상태를 2차원 배열로 가져옵니다.
    const cellSize = 110; // 셀 크기(100px) + 간격(10px) = 110px, 타일 이동 거리 계산에 사용됩니다.
    const animations = []; // 이동 및 병합 애니메이션 정보를 저장할 배열입니다.
    const mergedPositions = new Set();

    // 게임 보드의 각 줄(행 또는 열)에 대해 반복합니다.
    for (let i = 0; i < gridSize; i++) {
        let line = []; // 현재 처리 중인 줄을 저장할 배열입니다.
        let originalLine = []; // 현재 처리 중인 줄의 원본 상태를 저장할 배열입니다.

        // 이동 방향(BestMove)에 따라 줄(행 또는 열)을 추출합니다.
        if (BestMove === 'up' || BestMove === 'down') {
            // 위 또는 아래로 이동: 열 단위로 추출
            line = grid.map(row => row[i]); // 각 행에서 i번째 열의 값을 가져와 배열로 만듭니다.
            originalLine = line.slice(); // 현재 줄의 원본 상태를 복사하여 저장합니다.
        } else {
            // 좌 또는 우로 이동: 행 단위로 추출
            line = grid[i]; // i번째 행을 가져옵니다.
            originalLine = line.slice(); // 현재 줄의 원본 상태를 복사하여 저장합니다.
        }

        // 우측 또는 하단으로 이동하는 경우, 배열을 뒤집어서 이동 및 병합 로직을 재활용합니다.
        let isReversed = false; // 줄이 뒤집혔는지 여부를 저장할 변수
        if (BestMove === 'right' || BestMove === 'down') {
            line = line.slice().reverse(); // 원본 보존을 위해 복사 후 뒤집습니다.
            originalLine = originalLine.slice().reverse(); // 원본 줄도 뒤집어줍니다.
            isReversed = true; // 줄이 뒤집혔음을 표시합니다.
        }

        // 병합 및 이동을 수행합니다. (simulateMergeList 함수가 이동 및 병합을 모두 처리)
        const mergeResult = simulateMergeList(line); // 현재 줄에 대해 병합을 수행합니다.
        let updatedLine = mergeResult.result;   // 병합 및 이동 결과가 담긴 배열입니다.
        const movements = mergeResult.movements; // 병합 및 이동에 대한 상세 정보(from, to, value, mergedWith, newValue)를 담고 있습니다.

        // 우측 또는 하단으로 이동하는 경우, 배열을 다시 뒤집어 원래 순서로 복원합니다.
        if (isReversed) {
            updatedLine = updatedLine.slice().reverse(); // 병합 및 이동 결과를 뒤집어 원래 순서로 복원합니다.

            // movements 배열의 from, to, mergedWith 값도 gridSize 기준으로 뒤집어야합니다.
            movements.forEach(move => {
                move.from = gridSize - 1 - move.from; // from 인덱스를 보정합니다. 3-1-1 = 1
                move.to = gridSize - 1 - move.to; // to 인덱스를 보정합니다.
                if (move.mergedWith !== undefined) {
                    move.mergedWith = gridSize - 1 - move.mergedWith; // 병합된 위치(mergedWith)를 보정합니다.
                }
            });
        }

        // 애니메이션에 필요한 정보를 수집합니다.
        for (let move of movements) {
            let fromIndex = move.from; // 이동 전 인덱스
            let toIndex = move.to; // 이동 후 인덱스
            const value = move.value; // 이동 전 값
            const newValue = move.newValue; // 이동 후 값 (병합된 경우 새로운 값)
            const isMerged = move.mergedWith !== undefined; // 병합 여부

            // 이동 방향에 따라 fromRow, fromCol, toRow, toCol 값을 설정합니다.
            let fromRow, fromCol, toRow, toCol;
            if (BestMove === 'up' || BestMove === 'down') {
                // 위 또는 아래로 이동: 열 단위
                fromRow = fromIndex; // 이동 전 행 위치
                fromCol = i; // 이동 전 열 위치 (i번째 열)
                toRow = toIndex; // 이동 후 행 위치
                toCol = i; // 이동 후 열 위치 (i번째 열)
            } else {
                // 좌 또는 우로 이동: 행 단위
                fromRow = i; // 이동 전 행 위치 (i번째 행)
                fromCol = fromIndex; // 이동 전 열 위치
                toRow = i; // 이동 후 행 위치 (i번째 행)
                toCol = toIndex; // 이동 후 열 위치
            }

            // 현재 위치에 있는 타일 엘리먼트를 가져옵니다.
            const tile = document.querySelector(`.cell[data-row="${fromRow}"][data-col="${fromCol}"] .tile`);
            // 타일이 있고, 이동이 일어난 경우에만 애니메이션 정보를 배열에 추가합니다.
            if (tile && (fromRow !== toRow || fromCol !== toCol)) {
                animations.push({ // 애니메이션 정보를 객체 형태로 배열에 추가합니다.
                    tile, // 이동할 타일의 DOM 엘리먼트입니다.
                    fromX: fromCol * cellSize, // 이동 전 X 좌표입니다.
                    fromY: fromRow * cellSize, // 이동 전 Y 좌표입니다.
                    toX: toCol * cellSize, // 이동 후 X 좌표입니다.
                    toY: toRow * cellSize, // 이동 후 Y 좌표입니다.
                    toRow: toRow,
                    toCol: toCol,
                    newValue: newValue, // 이동 후의 값 (병합된 경우 새로운 값)
                    isMerged: isMerged, // 병합되었는지 여부.
                    removeAfter: true // 병합 또는 이동 후 타일 제거 여부.
                });
                if (isMerged) {
                    const positionKey = `${toRow}-${toCol}`;
                    mergedPositions.add(positionKey);
                }
            }
        }

        // 게임 보드(grid)를 업데이트합니다.
        if (BestMove === 'up' || BestMove === 'down') {
            for (let j = 0; j < gridSize; j++) grid[j][i] = updatedLine[j]; // 열을 기준으로 업데이트합니다.
        } else {
            for (let j = 0; j < gridSize; j++) grid[i][j] = updatedLine[j]; // 행을 기준으로 업데이트합니다.
        }
    }

    // 애니메이션을 적용합니다.
    let completedAnimations = 0; // 완료된 애니메이션 수를 추적합니다.
    const totalAnimations = animations.length; // 총 애니메이션 수를 저장합니다.

    // 각 애니메이션 정보에 대해 반복합니다.
    animations.forEach(({ tile, fromX, fromY, toX, toY, toRow, toCol, newValue, isMerged, removeAfter }) => {
        const deltaX = toX - fromX; // X축 이동 거리입니다.
        const deltaY = toY - fromY; // Y축 이동 거리입니다.
        tile.style.transform = `translate(${deltaX}px, ${deltaY}px)`; // 타일을 이동시킵니다.

        // 애니메이션 완료 시 처리
        tile.addEventListener('transitionend', function handler() { // 각 타일의 이동 애니메이션이 끝나면 실행할 이벤트 리스너를 추가합니다.
            tile.removeEventListener('transitionend', handler); // 이벤트 핸들러를 제거합니다.
            if (removeAfter) tile.remove(); // 기존 타일을 DOM에서 제거합니다.
            completedAnimations++; // 완료된 애니메이션 수를 증가시킵니다.
            if (completedAnimations === totalAnimations) finishMove(grid, mergedPositions); // 모든 애니메이션이 완료되면 finishMove 함수를 호출합니다.
        }, { once: true }); // 이벤트 핸들러는 한 번만 실행됩니다.
    });

    // 애니메이션이 없는 경우 즉시 종료합니다.
    if (totalAnimations === 0) finishMove(grid);
}


/**
 * 애니메이션 완료 후 DOM과 보드 상태를 갱신
 * @param {Array} grid - 업데이트된 게임 보드
 */
function finishMove(grid, mergedPositions) {
    // 모든 셀의 기존 타일 제거(병합되서 겹쳐진거 제거)
    document.querySelectorAll('.cell .tile').forEach(tile => tile.remove());

    // 모든 셀에 새 타일 추가
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const value = grid[i][j];
            if (value !== null) {
                const cell = document.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.innerText = value;
                tile.dataset.value = value;
                const positionKey = `${i}-${j}`;
                if (mergedPositions.has(positionKey)) {
                    tile.classList.add('merged');
                }
                // tile.style.transform = 'translate(0, 0)';
                if (cell.querySelector('.tile') === null) { // 중복 추가 방지
                    cell.appendChild(tile);
                }
            }
        }
    }
    setCurrentState("FinishTurn");
}

/**
 * 타일 이동 및 병합을 시뮬레이션하는 함수입니다.
 * 주어진 한 줄(행 또는 열)에 대해 병합을 수행하고, 병합 결과, 점수, 이동 정보를 반환합니다.
 *
 * @param {Array<number|null>} line - 시뮬레이션할 한 줄의 배열 (숫자 또는 null).
 * @returns {{result: Array<number|null>, score: number, movements: Array<object>}} - 병합 결과, 점수, 이동 정보를 담은 객체.
 */
function simulateMergeList(line) {
    let score = 0; // 병합으로 얻는 총 점수
    let result = []; // 병합 후의 타일 값들을 저장할 배열
    let canMerge = true; // 현재 위치의 타일이 병합 가능한지 여부 (연속 병합 방지)
    const targetLength = line.length; // 원래 배열의 길이를 저장 (결과 배열의 길이를 맞추기 위함)
    let movements = []; // 각 타일의 이동 및 병합 정보를 저장할 배열

    // 주어진 줄(line)의 각 타일에 대해 반복
    for (let i = 0; i < line.length; i++) {
        if (line[i] === null) continue; // 현재 위치가 빈칸(null)이면 다음 타일로 넘어감

        // 현재 타일(line[i])이 병합 가능한지 검사
        if (
            result.length > 0 && // 결과 배열(result)에 하나 이상의 값이 이미 존재하고
            result[result.length - 1] === line[i] && // 직전에 추가된 값과 현재 값이 같고
            canMerge // canMerge가 true인 경우 (직전 값이 병합된 직후가 아닐 경우)
        ) {
            // 병합 처리
            const mergedValue = result[result.length - 1] * 2; // 병합된 값은 기존 값의 2배
            result[result.length - 1] = mergedValue; // 병합된 값을 결과 배열에 갱신
            score += mergedValue; // 병합된 값만큼 점수 증가
            canMerge = false; // 연속 병합을 막기 위해 canMerge를 false로 설정

            // 병합 정보 기록
            const toIndex = result.length - 1; // 병합된 위치 인덱스
            // 병합시 일어난 이동정보 기록
            movements.push(// 어디서, 어디로, 무슨값이, 병합 위치, 병합된 값 
                { from: i, to: toIndex, value: line[i], mergedWith: toIndex, newValue: mergedValue }
            );

            // 직전 타일의 이동 정보 업데이트
            // 이동없이 병합된 타일의 movement 찾기
            const lastMovement = movements.find(m => m.to === toIndex && !m.mergedWith);
            if (lastMovement) {
                lastMovement.mergedWith = i; // 직전 타일과 현재 타일(i)이 병합되었음을 기록
                lastMovement.newValue = mergedValue; // 직전 타일의 병합 결과를 기록
            }
        } else {
            // 병합 조건에 해당하지 않으면 타일 추가
            result.push(line[i]); // 현재 타일을 결과 배열에 추가
            canMerge = true; // 현재 타일이 추가되었으므로, 다음 타일과 병합 가능

            // 이동 정보 기록
            movements.push({
                from: i, // 이동 전 인덱스
                to: result.length - 1, // 이동 후 인덱스
                value: line[i], // 이동 전 값
                mergedWith: undefined, // 병합되지 않았으므로 undefined
                newValue: line[i] // 이동 후 값은 동일
            });
        }
    }

    // 결과 배열의 길이를 원래 배열의 길이와 동일하게 조정 (빈 칸을 null로 채움)
    while (result.length < targetLength) {
        result.push(null); // 빈 칸은 null로 채움
    }

    // 결과 배열(result), 점수(score), 이동 정보(movements)를 객체 형태로 반환
    return { result, score, movements };
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
    const spaceButton = document.querySelector('.show-space');
    if (coolTime > 0) {
        spaceButton.classList.add('disable');
    } else {
        spaceButton.classList.remove('disable');
    }
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
    
    // grid 사이즈별 클래스 추가 부여
    grid.classList.add(`size-${gridSize}`);

    
    // const baseSize = 420; // 4x4 기준의 그리드 전체 크기 (padding 제외)
    // const tileSize = Math.floor((baseSize - (10 * (gridSize - 1))) / gridSize); // gap 10px 고려

    // // 그리드 템플릿 설정
    // grid.style.gridTemplateColumns = `repeat(${gridSize}, ${tileSize}px)`;
    // grid.style.gridTemplateRows = `repeat(${gridSize}, ${tileSize}px)`;

    // // 전체 그리드 크기는 4x4 기준으로 고정
    // grid.style.width = `${baseSize}px`;
    // grid.style.height = `${baseSize}px`;

    // // 타일 크기 동적 조정을 위한 CSS 변수 설정
    // document.documentElement.style.setProperty('--tile-size', `${tileSize}px`);
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
        default:
            playerSkillCoolTime = 1;
            break;
    }
}

export { clickSkill, CurrentGameState, DrawBoard, explodeTile, setCurrentState };

