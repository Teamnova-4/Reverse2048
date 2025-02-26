import { CurrentGameState, DrawBoard, explodeTile } from "./main.js";

export class Value {
    constructor(value) {
        this.value = value;
        this.isShield = false;
        this.isFixed = false;
        this.isExplode = false;
    }


    isEqual(value) {
        if (!isNaN(value)) {
            return this.value === value;
        } else if (value instanceof Value){
            return this.value === value.value;
        }
        return false;
    }
}

export class Tile {
    static isChanged;

    constructor(y, x, div) {
        this.x = x;
        this.y = y;
        this.div = div;

        this.isNumber = true;
        this.value = null;

        Tile.isChanged = false;

    }

    useSkill(skill) {

    }

    insertTile(value) {
        const val = new Value(value)
        if(val.value === "bomb")
            val.isExplode = true;
        this.setValue(val);
    }

    setValue(value){
        this.value = value;
        if (value === null || this.div.textContent === undefined){
            this.div.textContent = null;
        }else {
            this.div.textContent = value.value;
        }

        this.assignValue();
    }

    getTileColor(num){
        const colors = {
            0: "#EEE4DA",
            2: "#EEE4DA",
            4: "#EDE0C8",
            8: "#F2B179",
            16: "#F59563",
            32: "#F67C5F",
            64: "#F65E3B",
            128: "#EDCF72",
            256: "#EDCC61",
            512: "#EDC850",
            1024: "#EDC53F",
            2048: "#EDC22E",
        };
    
        // 숫자가 2048 초과일 경우 같은 색 유지 (또는 추가 변형 가능)
        return colors[num] || "#3C3A32"; // 2048 이상은 어두운 색
    };

    assignValue() {
        this.div.innerHTML = ""; // 기존 내용 지우기
        this.div.classList.remove("tile-fixed", "tile-shield"); // 기존 클래스 제거 추가
        if(this.value === null) {
            this.div.textContent = null;
            this.div.style.backgroundColor = "#cdc1b4";
            return;
        }

        if (this.value.value === "bomb") {
            const img = document.createElement("img");
            this.div.style.backgroundColor = "#EEE4DA";
            img.src = "Resources/bomb.png"; // 이미지 경로 설정
            img.alt = "Bomb"; // 이미지 대체 텍스트
            img.className = "tile-shield"; // 클래스 추가
            this.div.appendChild(img);
        } else {
            if(this.value.isFixed) {
                console.log(this.value);
                this.div.classList.add("tile-fixed");
            } else if(this.value.isShield) {
                console.log(this.value);
                this.div.classList.add("tile-shield");
            }

            this.div.textContent = this.value.value;

            this.div.style.backgroundColor = this.getTileColor(this.value.value);
        }
    }

    mergeEffect() {
        setTimeout(() => {
            this.div.style.animation = "mergeEffect 0.4s ease-in-out";
        },0);
    }
    resetTilePosition() {
        setTimeout(() => {
            this.div.style.transition = "transform 0.2s ease-in-out";
            this.div.style.transform = "translate(0px, 0px)";
        }, 200); // 200ms 후 원래 위치로 복귀
    }

    /**
     * 합칠수있는지 확인
     * 
     * 합칠수 있는 경우 return true;
     */
    isMergeAble(tile1Val, tile2Val) {
        return tile1Val === tile2Val;
    }



    startCheckValueChange(value = null) {
        this.checkValue = [];
        if (value !== null) {
            this.checkValue.push(value);
        }
    }
    checkValueChange(value) {
        if (this.checkValue !== null || this.checkValue !== undefined) {
            this.checkValue.push(value);
        }
    }

    endCheckValueChange() {
        const result = !(this.checkValue === null || this.checkValue.length === 0 || this.checkValue.every(v => v.value === this.checkValue[0].value));
        this.checkValue = null;
        return
    }

    static merge(tile1Val, tile2Val) {
        let result = null; 
        let score = 0;
        if (isNaN(tile1Val.value)){
            switch(tile1Val.value){
                case "bomb":
                    result = new Value("bomb");
                    result.isExplode = true;
                    score = Number.MAX_VALUE / 2;
                    break;
            }
        } else {
            result = new Value(tile1Val.value + tile2Val.value);
            score = tile1Val.value + tile2Val.value;
        }
        return {result, score};
    }

    static mergeList(arr){
        if (!Array.isArray(arr)) {
            throw new TypeError('입력은 배열이어야 합니다.');
        }
        
        // 1. null이 아닌 value들을 원래 순서대로 추출
        const nonNullValues = arr.reduce((acc, instance) => {
            if (instance.value !== null) {
                acc.push(instance.value);
            }
            return acc;
        }, []);

        //fix 스킬
        if (nonNullValues.some(value => value.isFixed )){
            nonNullValues.forEach(value => value.isFixed = false);
            return arr;
        }
        
        // 2. 좌측부터 인접한 같은 숫자 병합 (한 번 병합된 값은 재병합 불가)
        let explodeTileArr = [];
        const mergedValues = [];
        for (let i = 0; i < nonNullValues.length; i++) {
            if (i < nonNullValues.length - 1 && nonNullValues[i].isEqual(nonNullValues[i + 1])) {
                //쉴드 스킬 사용 체크
                if(!(nonNullValues[i].isShield || nonNullValues[i+1].isShield)){
                    if (nonNullValues[i].isExplode){
                        explodeTileArr.push(arr[mergedValues.length]);
                    }
                    mergedValues.push(Tile.merge(nonNullValues[i], nonNullValues[i + 1]).result);
                } else {
                    //쉴드 제거
                    nonNullValues[i].isShield = false;
                    nonNullValues[i+1].isShield = false;
                    mergedValues.push(nonNullValues[i]);
                    mergedValues.push(nonNullValues[i+1]);
                }
                i++; // 병합에 사용된 다음 값을 건너뜀
            } else {
                mergedValues.push(nonNullValues[i]);
            }
        }
        
        // 3. 원래 배열의 참조 순서를 유지하며 value 업데이트:
        //    좌측부터 병합 결과를 할당하고, 나머지는 null로 설정
        for (let i = 0; i < arr.length; i++) {
            arr[i].setValue((i < mergedValues.length) ? mergedValues[i] : null);
        }
        explodeTileArr.forEach(tile => {
            explodeTile(tile);
        });

        return arr;
    }

    static simulateMergeList(arr){
        if (!Array.isArray(arr)) {
            throw new TypeError('입력은 배열이어야 합니다.');
        }
        let mergedScore = 0;
        
        // 1. null이 아닌 value들을 원래 순서대로 추출
        const nonNullValues = arr.reduce((acc, instance) => {
            if (instance.value !== null && instance.value !== undefined) {
                acc.push(instance.value);
            }
            return acc;
        }, []);

        
        // 2. 좌측부터 인접한 같은 숫자 병합 (한 번 병합된 값은 재병합 불가)
        for (let i = 0; i < nonNullValues.length; i++) {
            if (!nonNullValues[i].isEqual(arr[i].value))
                Tile.isChanged = true;
            if (i < nonNullValues.length - 1 && nonNullValues[i].isEqual(nonNullValues[i + 1])) {
                mergedScore += 1 + this.merge(nonNullValues[i], nonNullValues[i + 1]).score;
                Tile.isChanged = true;
                i++; // 병합에 사용된 다음 값을 건너뜀
            }
        }

        return mergedScore;
    }
}