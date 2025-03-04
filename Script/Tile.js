import { getMergeScore, setMergeScore } from "./Board.js";
import { playSound } from "./main.js";

export class Cell {
    static gridHtml = document.getElementById("grid");
    static Grid = null;

    static cellSize = 100;
    static padding = 10;
    static width = 0;
    static height = 0;
    constructor(row, col, clickEvent) {

        if (row < 0 || row >= Cell.height || col < 0 || col >= Cell.width) {
            throw new Error("Cell 생성 오류: 유효하지 않은 좌표입니다.");
        }

        this.html = document.createElement("div");

        this.row = row;
        this.col = col;

        this.tile = null;
        this.newTile = null;

        this.html.addEventListener("click", (e) => {
            clickEvent(this);
        });

        this.html.classList.add("cell");
        this.html.classList.add("insert-mode-cell");

        Cell.gridHtml.appendChild(this.html);
    }

    static InitCells(width, height, clickEvent) {
        this.gridHtml.innerHTML = "";
        Cell.Grid = [];

        Cell.width = width;
        Cell.height = height;

        for (let row = 0; row < height; row++) {
            Cell.Grid[row] = [];
            for (let col = 0; col < width; col++) {
                Cell.Grid[row][col] = new Cell(row, col, clickEvent);
            }
        }
    }

    static printPos() {
        Cell.Grid.forEach(row => {
            let prt = "";
            row.forEach(cell => {
                prt += `[${cell.col}, ${cell.row}, ${cell.tile?.value}] `;
            });
            console.log(prt);
        });
    }

    static getCell(row, col) {
        return Cell.Grid[row][col];
    }

    static getCellHtml(row, col) {
        return Cell.Grid[row][col].html;
    }

    static DrawAll() {
        Cell.Grid.forEach(row => row.forEach(cell => cell.draw()));
    }

    // GriRow를 새 배열로 반환
    static GridRow(idx) {
        const row = [];
        // 필요한 행을 새 배열로 채운다
        for (let i = 0; i < Cell.width; i++) {
            row.push(Cell.Grid[idx][i]);  // idx 열을 추가
        }
        return row;
    }

    // GridCol을 새 배열로 반환
    static GridCol(idx) {
        const col = [];
        // 필요한 열을 새 배열로 채운다
        for (let i = 0; i < Cell.height; i++) {
            col.push(Cell.Grid[i][idx]);  // idx 행을 추가
        }
        return col;
    }

    static GridForEach(callback) {
        Cell.Grid.forEach(row => row.forEach(cell => callback(cell)));
    }



    static isSameLine(line1, line2) {
        return line1.every((cell, idx) => cell.tile?.value === line2[idx].tile?.value);
    }

    static isMoveAbleList(list) {
        let foundNull = false;
        let lastTile = null;
        return list.some(cell => {
            if (foundNull) {
                return true;
            } else if (cell.tile) {
                if (cell.tile.value === lastTile.value)
                    return true;

                lastTile = cell.tile;
            } else {
                foundNull = true;
            }

            return false;
        })
    }

    static getLineScore(line) {
        const moveScore = 1;
        let mergeScore = 0;     // 머지한 값의 총합을 구하기 위해 새로 만듬
        let findNullTile = false;
        let findMoveableTile = false;
        let lastTile = null;
        let score = 0;
        line.forEach(cell => {
            if (cell.tile) {
                if (lastTile !== null && cell.tile.value === lastTile.value) {
                    switch (cell.tile.type) {
                        case "Number":
                            score += moveScore * 5 + cell.tile.value * 2;
                            mergeScore += cell.tile.value * 2;
                            break;
                        case "Bomb":
                            score += Number.MAX_SAFE_INTEGER / 2;
                            break;
                    }
                    lastTile = null;
                } else if (findNullTile) {
                    findMoveableTile = true;
                } else {
                    lastTile = cell.tile;
                }
            } else {
                findNullTile = true;
            }
        });
        console.log(score, line);
        if (score === 0 && findMoveableTile) score = moveScore;
        return { score, mergeScore };
    }

    static mergeLine(line) {
        if (!Array.isArray(line)) {
            throw new TypeError('입력은 배열이어야 합니다.');
        }

        let moveableIdx = 0;
        for (let i = 0; i < line.length; i++) {
            const targetCell = line[moveableIdx];
            const currentCell = line[i];

            if (moveableIdx === i || currentCell.tile === null) {
                //자기 위치에 그대로 있는 경우
                continue;
            }

            if (currentCell.tile.isFixed) {
                // 고정된 타일인 경우
                moveableIdx = i;
                currentCell.tile.isFixed = false;
                continue;
            }

            if (targetCell.tile === null) {
                console.log("타겟이 null인 경우");
                currentCell.moveTile(targetCell, false);
            } else if (Tile.isMergeAble(targetCell.tile, currentCell.tile).result) {
                console.log("합쳐지는 경우");
                currentCell.moveTile(targetCell, true);// moveTile한 시점에 병합이 완료됨
                setMergeScore(getMergeScore() + targetCell.tile.value); // 변수를 가져오면 상수 할당 에러가 발생하여 함수로 감쌈
                moveableIdx++;
            } else {
                const { result, isEqual, isMergeAble, hasShield } = Tile.isMergeAble(targetCell.tile, currentCell.tile);
                if (hasShield) {
                    targetCell.tile.isShield = false;
                    currentCell.tile.isShield = false;
                }
                console.log("null 도 아니고 합쳐지지도 않는 경우");
                moveableIdx++;
                currentCell.moveTile(line[moveableIdx], false);
            }
        }
    }

    draw() {
        if (this.tile) {
            this.tile.html.className = "tile";
            this.tile.html.innerHTML = "";
            this.tile.html.dataset.value = this.tile.value;
            if (this.tile.type === "Number") {
                this.tile.html.textContent = this.tile.value;
            } else if (this.tile.type === "Bomb") {
                const img = document.createElement("img");
                img.className = "bomb";
                img.src = "Resources/bomb.png";
                img.style.width = "100%";
                this.tile.html.appendChild(img);
                this.tile.html.classList.add("tile-bomb");
            }

            if (this.tile.isShield) {
                this.tile.html.classList.add("tile-shield");
            }
            if (this.tile.isFixed) {
                this.tile.html.classList.add("tile-fixed");
            }
        } else {
            this.html.innerHTML = "";
        }
    }

    placeTile(value) {

        if (value === "bomb" || value === "Bomb") {
            playSound("bomb");
            this.addTile("Bomb", value);
        } else {
            playSound("place");
            this.addTile("Number", value);
        }
        console.log(Cell.Grid);
    }

    addTile(type, value) {
        this.setTile(new Tile(type, value));

        this.html.appendChild(this.tile.html);
    }

    moveTile(targetCell, isMergeAble) {
        if (this.tile === null)
            return;

        const tileSize = 100; // 예제: 타일 크기 (px)
        const gap = 10; // 예제: 타일 간격 (px)

        const startRow = this.row;
        const startCol = this.col;
        const endRow = targetCell.row;
        const endCol = targetCell.col;

        const offsetX = (startCol - endCol) * (tileSize + gap);
        const offsetY = (startRow - endRow) * (tileSize + gap);

        const movingTile = this.tile;
        const movingTileElement = movingTile.html;

        this.tile = null; // 현재 위치 타일 제거

        //this.html.removeChild(movingTileElement);
        targetCell.html.appendChild(movingTileElement);

        movingTileElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        movingTileElement.getBoundingClientRect(); // 강제 리플로우

        // 3. 애니메이션 적용
        movingTileElement.style.transition = "transform 0.2s ease-out"; // 0.2초 애니메이션
        movingTileElement.style.transform = `translate(0px, 0px)`;

        // **1. 논리적인 값 변경 (애니메이션 시작 전에 값 합치기)**
        if (isMergeAble) {
            targetCell.tile.merge(movingTile); // 타일 합치기
        } else {
            targetCell.setTile(movingTile); // 그냥 이동
            movingTile.notMergedCount++; // 병합되지 않았으므로 병합되지않음음 카운트 증가
            console.log("병합이 되지 않았습니다! :" + movingTile.notMergedCount)
        }

        // 4. 애니메이션 종료 후 실제 이동 처리
        movingTileElement.addEventListener("transitionend", () => {
            // 5. 최종 위치에서 transform 초기화 (애니메이션 완료 후 리셋)
            movingTileElement.style.transition = "";
            movingTileElement.style.transform = "";

            if (isMergeAble) {
                targetCell.tile.mergeAnimation();
                targetCell.html.removeChild(movingTileElement); // 타일 제거
            }

        }, { once: true });
    }

    setTile(tile) {
        tile.cell = this;
        this.tile = tile;
    }

    removeTile() {
        this.tile = null;
        this.draw();
    }
}

export class Tile {
    constructor(type, value) {
        this.html = document.createElement("div");
        this.type = type;

        switch (type) {
            case "Bomb":
                this.value = -10;
                break;
            case "Number":
                this.value = value;
                break;
            default:
                throw new Error("유효하지 않은 타입입니다");
        }

        this.isShield = false;
        this.isFixed = false;

        this.isExplode = false;
        this.isMerged = false;
        this.notMergedCount = 0; // 병합되지 않은 횟수
        this.cell = null;
    }

    copy() {
        const copy = new Tile(this.type, this.value);
        copy.isShield = this.isShield;
        copy.isFixed = this.isFixed;
        copy.isExplode = this.isExplode;
        copy.isMerged = this.isMerged;
        return copy;
    }


    static isMergeAble(tile1, tile2) {
        const isEqual = tile1.type === tile2.type && tile1.value === tile2.value;
        const isMergeAble = !tile1.isMerged && !tile2.isMerged;
        const hasShield = tile1.isShield || tile2.isShield;

        return {
            result: isEqual && isMergeAble && !hasShield,
            isEqual, isMergeAble, hasShield
        }
    }

    merge(other) {
        this.value += other.value;
        this.isMerged = true;
        this.notMergedCount = 0; // 병합되지 않은 횟수
        if (this.type === "Bomb") {
            this.isExplode = true;
        }
    }

    mergeAnimation() {
        this.html.classList.add("merged");
        this.html.addEventListener("animationend", () => {
            this.html.classList.remove("merged");
        }, { once: true });

    }
}