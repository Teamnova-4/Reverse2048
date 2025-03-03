import { playSound, Cell } from "./main.js";

let clickMode = "insertMode";
let insertTile;

let turn = 0;
let CurrentGameState;

let gridSize = parseInt(localStorage.getItem("gameSize"));
let board;

let BestMove;

let baseLimitTime = 6;
let timer;
let limitTime = baseLimitTime;
let gameTime = 0;
let gameTimer;

//스킬 변수
let playerSkill = localStorage.getItem("gameSkill");
let playerSkillCoolTime;
setSkillCoolTime();
let coolTime = 0;

let isSequence = false;
let isMindControl = false;

let idleTimer; // 타이머 변수 추가

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

// 스킬 버튼 클릭 후 타일 호버 효과 변경하는 함수
function assignSkillMode(isSkillMode = true) {
  const grid = document.getElementById("grid");
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = getGridElement(r, c);
      if (isSkillMode) {
        cell.classList.add("skill-mode-cell");
        cell.classList.remove("insert-mode-cell");
      } else {
        cell.classList.remove("skill-mode-cell");
        cell.classList.add("insert-mode-cell");
      }
    }
  }
}
function getGridElement(row, column) {
  const grid = document.getElementById("grid").children;
  return grid[gridSize * row + column];
}

// 스킬 사용 버튼이 클릭되었을 때 호출되는 함수
function clickSkill() {
  if (coolTime === 0) {
    // 스킬 사용시 쿨타임 적용
    coolTime = playerSkillCoolTime;
    UseSkill();
  } else {
    console.log(`coolTime : ${coolTime}`);
  }
}


function DrawBoard() {
    Cell.DrawAll();
}

/**
 * 게임 보드를 초기화하는 함수
 */
function initBoard() {
    Cell.InitCells(gridSize, gridSize, (cell)=> {
        if (clickMode === "insertMode") {
            placeTile(cell);
        } else if (clickMode === "skillMode") {
            UseSkillToTile(cell)
        }
    });
    DrawBoard();
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
      clearTimeout(idleTimer); // 이전 타이머 클리어
      idleTimer = setTimeout(() => {
        Cell.GridForEach(cell => {
          if (cell.tile) {
            const randomValue = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
            const randomIndex = Math.floor(Math.random() * randomValue.length);
            const displayedValue = randomValue[randomIndex]; // 랜덤 숫자 생성

            cell.tile.html.textContent = displayedValue; // 랜덤 숫자 표시
            cell.tile.html.dataset.value = displayedValue; // data-value 설정

          }
        });
      }, 2000); // 2초 후 랜덤 숫자 표시

      insertTile = Math.random() < 0.9 ? 2 : 4;
      document.getElementById("next").innerText = insertTile;

      const grid = document.getElementById("grid");
      grid.classList.remove("mind-control");

      break;
    case "FinishControl":
      clearInterval(timer);
      setTimeout(() => {
        setCurrentState("Simulate");
      }, 500);
      break;
    case "Simulate":
      simulate();
      break;
    case "Move":
      move();
      break;
    case "FinishTurn":
      finishTurn();
      // gameEnding();
      break;
    case "End":
      gameEnding();
      break;
  }
  DrawBoard();
}

function gameEnding() {
  console.log("게임이 끝났습니다!");
  // 게임 플레이시간 데이터
  const formattedTime = updateGameTimeDisplay();
  // 클리어모달(화면)
  showGameClearModal(turn, formattedTime);
}

async function sendRankingData(nickname, turn, formattedTime, gameSize) {
  try {
    const response = await fetch("./php/save_ranking.php", {
      // 경로 수정
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname, turn, formattedTime, gameSize }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("[Board.js]랭킹 데이터 저장 성공");
      window.location.href = `ranking.html`;
    } else {
      console.error("[Board.js]랭킹 데이터 저장 실패:", data.message);
      alert(`[Board.js]데이터 저장 실패: ${data.message}`);
    }
  } catch (error) {
    console.error("[Board.js]랭킹 데이터 전송 중 오류 발생:", error);
    alert("[Board.js]데이터 전송 중 오류 발생:", error);
  }
}

// 닉네임의 바이트 길이를 계산하는 함수
function getByteLength(str) {
  let byteLength = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    // 한글은 2바이트, 영어는 1바이트로 처리
    byteLength += char > 128 ? 2 : 1;
  }
  return byteLength;
}
// 100위권안에 들어가는지 확인합니다.
async function checkrank_DB_userScore(turn, formattedTime) {
  try {
    const response = await fetch("./php/check_ranking.php", {
      // check_ranking.php 또는 canRegister.php
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ turn: turn, formattedTime: formattedTime }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("data.count: " + data.count);
    console.log("data.success: " + data.success);
    console.log("data.canRegister: " + data.canRegister);

    if (data.success && data.canRegister) {
      // 순위가 확인이 됬으니 랭크 등록이 가능하다.
      console.log("[Board.js] DB 100위 순위확인성공");
      gameSizeCheck();
      document.getElementById("view-ranking").style.display = "none";
      // 랭킹등록 버튼 활성화
      document.getElementById("submit-nickname").disabled = false;
      // 닉네임 입력창
      document.getElementById("nickname-input").style.display = "block";
      // 랭킹등록 버튼
      document.getElementById("submit-nickname").style.display = "block";
      // "Submit" 버튼 클릭 이벤트 처리: 닉네임 가져와서 sendRankingData 호출
      document
        .getElementById("submit-nickname")
        .addEventListener("click", () => {
          const nickname = document.getElementById("nickname-input").value;
          // 유효성 검사
          if (!nickname) {
            alert("닉네임을 입력해주세요.");
          } else if (/\s/.test(nickname)) {
            // 공백(스페이스바) 포함 여부 검사
            alert("닉네임에는 공백을 포함할 수 없습니다.");
          } else if (getByteLength(nickname) > 32) {
            alert("닉네임이 너무 길어요, 조금 줄여주세요!!");
          } else {
            // 순위가 확인됬으니 db에 저장하자
            sendRankingData(
              nickname,
              turn,
              updateGameTimeDisplay(),
              gameSizeCheck()
            );
          }
        });
    } else {
      console.log(
        "[Board.js]DB 순위권 미달 100등이상 : 타이틀로버튼, 랭킹보기버튼 보이기기"
      );
      // 랭킹등록 버튼 활성화
      document.getElementById("submit-nickname").disabled = true;
      // 닉네임 입력창
      document.getElementById("nickname-input").style.display = "none";
      // 랭킹등록 버튼
      document.getElementById("submit-nickname").style.display = "none";
      // 랭킹보기 버튼
      document.getElementById("view-ranking").style.display = "block";
      // 랭킹보기 기능부여(랭크페이지 이동동)
      document.getElementById("view-ranking").addEventListener("click", () => {
        window.location.href = `ranking.html`;
      });
    }
  } catch (error) {
    console.error("[Board.js]DB 100위 순위 데이터 전송 중 오류 발생:", error);
    alert("[Board.js]DB 100위 순위 전송 중 오류 발생:" + error);
    return null; // 실패 시 null 반환
  }
}

function gameSizeCheck() {
  const gameSize = localStorage.getItem("gameSize");
  if (!gameSize) {
    console.error("[Board.js] 게임 크기를 알 수 없음");
    alert("[Board.js] 게임 크기를 알 수 없음");
    return; // 게임 크기를 알 수 없으면 저장 안 함
  } else {
    console.log("[Board.js] 게임 크기: " + gameSize);
    return gameSize;
  }
}

// 게임 클리어 모달 표시 (이름 변경, 칭찬 문구 수정)
async function showGameClearModal(turns, time) {
  console.log("게임클리어화면시작!");
  document.getElementById("final-turns").textContent = turns;
  document.getElementById("final-time").textContent = time;
  document.getElementById("game-over-screen").classList.remove("hidden");
  console.log("db에서 100위 확인시작!");
  // 게임클리어 화면이 나오고 난 후 db에 100등에 들어가는지 조회합니다.
  checkrank_DB_userScore(turns, time);
}

// 타이틀 이동 버튼 ->
document.getElementById("go_title_1").addEventListener("click", () => {
  document.getElementById("game-over-screen").classList.add("hidden"); // ID 변경
  window.location.href = `ChoiseMode.html`;
});

// (선택 사항) 모달 바깥 클릭 시 닫기
window.addEventListener("click", (event) => {
  if (event.target.id === "game-over-screen") {
    // ID로 확인
    event.target.classList.add("hidden");
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

    Cell.GridForEach((cell)=>{
        if (cell.tile) {
            cell.tile.isMerged = false;

            if(cell.tile.isExplode) {
                explodeTile(cell.row, cell.col);
            }
        }
    });

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

    if (countTime % limitTime == 0) {
      divideAllTileByNumber();
      countTime= 0;
    }
    // 1초마다 event3 실행
    showHtmlTimeCount(countTime);
  }, 1000);
  return timer;
}

function divideAllTileByNumber() {
    Cell.GridForEach((cell) => {
        if (cell.tile) {
            const value = cell.tile.value;
            if (value === 2 || value === 0) {
                cell.removeTile();
            } else if (value === "bomb") {
            } else {
                cell.tile.value = Number.parseInt(cell.tile.value / 2);
            }
            cell.draw();
        }
    });
    const tileNumbers = [16, 32, 64];
    const randomNumber = Math.floor(Math.random() * tileNumbers.length);

    insertTile = tileNumbers[randomNumber];
    document.getElementById("next").innerText = insertTile;

    baseLimitTime = Math.max(baseLimitTime-1, 2);
    limitTime = baseLimitTime;

    playSound("emergency");
}

function showHtmlTimeCount(countTime) {
    //console.log("ShowHtmlTimeCOunt " + countTime);
    // 턴마다 6초 제한 표시
    // 6초에서 카운트다운 되는 형식으로 제한시간 표시
    let remainingTime = limitTime-countTime;
    if(remainingTime <= 2){
        document.getElementById('limit').style.color = '#ea6357';
    } else {
        document.getElementById('limit').style.color = 'white';
    }
    document.getElementById('limit').innerText = remainingTime;

};

/**
 * 빈 칸에 타일을 배치하는 함수입니다.
 *
 * @param {cell} cell - 타일을 배치할 빈칸 태그
 */
function placeTile(cell) {
    if (cell.html.innerHTML.trim() === "" && CurrentGameState === "Control") {
        cell.placeTile(insertTile);

        // 타일 설치 시 랜덤 페이크 숫자를 원래 숫자로 되돌리기
        if (cell.tile) {
            cell.tile.html.textContent = cell.tile.value; // 원래 숫자 표시
        }

        if (isSequence) {
            isSequence = false;
            cell.draw();
        } else {
            setCurrentState("FinishControl");
        }
    }
}

/**
 * 시스템 턴 (병합 시뮬레이션)을 실행하는 함수입니다.
 * 이 함수는 각 방향(상, 하, 좌, 우)으로 타일을 이동했을 때
 * 예상되는 병합 점수를 계산하고, 그 중 최적의 방향을 선택합니다.
 *
 * 이번 이동의 방향(BestMove) 를 "up", "down", "left", "right" 중 하나로 할당합니다.
 */
function simulate() {
    const directions = ["up", "down", "left", "right"]; // 가능한 이동 방향들
    let maxMergeScore = 0; // 최대 병합 점수
    let bestMove = []; // 최고 병합 점수를 가진 방향들

    let worstMove = [];
    let minMergeScore = Number.MAX_SAFE_INTEGER;



    directions.forEach((direction) => {
        let simulateList = [];

        for (let i = 0; i < gridSize; i++) {
            switch (direction) {
                case "up":
                    simulateList.push(Cell.GridCol(i));
                    break;
                case "down":
                    simulateList.push(Cell.GridCol(i).reverse());
                    break;
                case "left":
                    simulateList.push(Cell.GridRow(i));
                    break;
                case "right":
                    simulateList.push(Cell.GridRow(i).reverse());
                    break;
            }
        }

        const totalScore = simulateList.reduce((total, line) => {
            return total + Cell.getLineScore(line);
        }, 0);

        console.log(direction, totalScore, simulateList);
        /*
        const totalScore = simulateList.reduce((total, line) => {
            return total + Cell.mergeCellListToTileList(line)
                .filter(tile => tile !== null)
                .map(tile => tile.score())
                .reduce((sum, value) => sum + value, Cell.isMoveAbleList(line) ? 1: 0);
        }, 0);
        */

        if (totalScore === 0) {
        } else if (totalScore > maxMergeScore) {
            maxMergeScore = totalScore;
            bestMove = [direction];
        } else if (totalScore === maxMergeScore) {
            bestMove.push(direction);
        } else if (totalScore < minMergeScore) {
            minMergeScore = totalScore;
            worstMove = [direction];
        } else if (totalScore === minMergeScore) {
            worstMove.push(direction);
        }
    });

    if (isMindControl) {
        isMindControl = false;
        BestMove = worstMove[Math.floor(Math.random() * worstMove.length)];
        setCurrentState("Move");
    } else if (bestMove.length > 0) {
        // 병합 가능한 방향 중 랜덤 선택
        BestMove = bestMove[Math.floor(Math.random() * bestMove.length)];
        console.log("Best Move (merge): ", BestMove);
        setCurrentState("Move");
    } else {
        // 이동 불가능한 경우
        console.log("No valid moves");
        setCurrentState("End");
    }
}


function move() {
    playSound("move"); // 이동 사운드를 재생합니다.

    console.log(BestMove);

    for (let i = 0; i < gridSize; i++) {
        let simulateList = []; // 시뮬레이션에 사용되는 셀의 배열

        switch (BestMove) {
            case "up":
                simulateList = Cell.GridCol(i);
                break;
            case "down":
                simulateList = Cell.GridCol(i).reverse();
                break;
            case "left":
                simulateList = Cell.GridRow(i);
                break;
            case "right":
                simulateList = Cell.GridRow(i).reverse();
                break;
        }
        Cell.mergeLine(simulateList)
    }
    setTimeout(() => { setCurrentState("FinishTurn"); }, 500);
}

  

function explodeTile(r, c) {
  const grid = document.getElementById("grid");
  const minX = Math.max(c - 1, 0);
  const minY = Math.max(r - 1, 0);
  const maxX = Math.min(c + 1, gridSize - 1);
  const maxY = Math.min(r + 1, gridSize - 1);

  console.log(board);
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
        Cell.getCell(y, x).removeTile();
    }
  }
  Cell.getCell(r, c).removeTile();

  console.log("Bomb explode");
}

// 타일 지정 스킬이 타일을 지정할 때 실행되는 함수
function UseSkillToTile(cell) {
    const tile = cell.tile;
    assignSkillMode(false);
    clickMode = "insertMode";
    if (tile === null && CurrentGameState === "Control") {
        coolTime = 0;
        updateCooltime();
        return;
    }

    switch (playerSkill) {
        case "shield":
            tile.isShield = true;
            break;
        case "fix":
            tile.isFixed = true;
            break;
        case "double":
            tile.value *= 2;
            cell.draw();
            break;
        default:
    }
    /**
     const tile = cell.children.length === 1 ? cell.children[0] : null;
    assignSkillMode(false);
    clickMode = "insertMode";

    // 빈칸을 선택하면 스킬사용을 취소한다.
    if (tile === null && CurrentGameState === "Control") {
        coolTime = 0;
        updateCooltime();
        return;
    }

    switch (playerSkill) {
        case "shield":
            // 선택필요 스킬
            tile.dataset.isShield = "true";
            tile.classList.add('tile-shield');
            break;
        case "fix":
            tile.dataset.isFixed = "true";
            // 선택필요 스킬
            break;
        case "double":
            const value = tile.dataset.value;
            tile.dataset.value = value * 2;
            tile.textContent = value * 2;
            break;
        default:
    }

    DrawBoard();
    */
}

// 스페이스 바(스킬 사용 아이콘) 클릭시 실행되는 함수
function UseSkill() {
  const grid = document.getElementById("grid");
  switch (playerSkill) {
    case "zeroTile": // 완료
      insertTile = 0;
      document.getElementById("next").innerText = insertTile;
      break;
    case "timeAmplification": // 완료
      limitTime = 15;
      showHtmlTimeCount(limitTime);
      break;
    case "shield": // 미완료
      // 선택필요 스킬
      clickMode = "skillMode";
      assignSkillMode();

      break;
    case "fullShield":
      for (const cell of grid.children) {
        if (cell.children.length === 1) {
          cell.children[0].dataset.isShield = "true";
        }
      }
      console.log(grid.children);
      break;
    case "bomb": //미완료
      insertTile = "bomb";
      break;
    case "fix": //미완료
      // 선택필요 스킬
      clickMode = "skillMode";
      assignSkillMode();
      break;
    case "mindControl": // 중완료
      grid.classList.add("mind-control");
      isMindControl = true;
      break;
    case "double": // 완료
      // 선택필요 스킬
      clickMode = "skillMode";
      assignSkillMode();
      break;
    case "sequence": //완료
      isSequence = true;
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
  document.getElementById("time").innerText = minute + ":" + second;
  // console.log('minute: ' + minute);
  // console.log('second: ' + second);
  let timeString = minute + ":" + second;

  return timeString;
}

function updateCooltime() {
  const spaceButton = document.querySelector(".show-space");
  if (coolTime > 0) {
    spaceButton.classList.add("disable");
  } else {
    spaceButton.classList.remove("disable");
  }
  const overlay = document.getElementById("cooltimeOverlay");
  const cooltimeSpan = document.getElementById("cooltime");

  if (coolTime > 0) {
    overlay.classList.add("active");
    cooltimeSpan.textContent = coolTime;
  } else {
    overlay.classList.remove("active");
  }
}

function setGridSize() {
  // 게임 사이즈 가져오기, 지정이 안되면 디폴트로 4로 지정
  if (isNaN(gridSize)) {
    gridSize = 4; // 디폴트 값 설정
    localStorage.setItem("gameSize", gridSize); // 로컬 스토리지에 저장
  } else {
    gridSize = parseInt(gridSize); // 문자열을 숫자로 변환
  }

  // grid 사이즈별 클래스 추가 부여
  const grid = document.getElementById("grid");
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
    case "zeroTile":
      playerSkillCoolTime = 12;
      break;
    case "timeAmplification":
      playerSkillCoolTime = 8;
      break;
    case "shield":
      playerSkillCoolTime = 10;
      break;
    case "fullShield":
      playerSkillCoolTime = 30;
      break;
    case "bomb":
      playerSkillCoolTime = 1;
      break;
    case "fix":
      playerSkillCoolTime = 5;
      break;
    case "mindControl":
      playerSkillCoolTime = 15;
      break;
    case "double":
      playerSkillCoolTime = 8;
      break;
    case "sequence":
      playerSkillCoolTime = 10;
      break;
    case "미선택":
      playerSkillCoolTime = 0;
      break;
    default:
      playerSkillCoolTime = 1;
      break;
  }
}

export {
  clickSkill,
  CurrentGameState,
  DrawBoard,
  explodeTile,
  setCurrentState,
};
