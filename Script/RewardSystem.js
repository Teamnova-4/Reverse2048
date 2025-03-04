import {
    getGiveUpTurnCount,
    getTimer,
    playerHP,
    setGiveUpTurnCount,
    setHP,
    setTimer,
    startTimer,
    setSequence
} from "./Board.js";

export class RewardSystem {
    constructor() {
        this.rewardOptions = null; // 보상 목록

        this.types = {
            heal: 'heal',
            bonus_block: 'bonus_block',
        }; // 보상 타입 목록

        this.initRewardOptions();
    }

    // 보상 선택 UI 표시
    showRewards(giveUpTurnCount) {
        console.log("🎁 보상 선택 UI 표시");
        // 턴 타이머 정지
        clearInterval(getTimer());

        const overlay = document.createElement("div");
        overlay.classList.add("reward-overlay");

        const container = document.createElement("div");
        container.classList.add("reward-container");
        container.innerHTML = "<h2>보상 선택</h2>";

        const cardsContainer = document.createElement("div");
        cardsContainer.classList.add("reward-cards");

        // 방치한 턴에 맞는 랜덤한 3개의 보상 선택지 생성
        const selected = this.getRandomRewards(giveUpTurnCount, 3);
        console.log(
            "🎁 선택된 보상 옵션:",
            selected
        );

        selected.forEach((reward, index) => {
            const rewardCard = document.createElement("div");
            rewardCard.classList.add("reward-card");
            rewardCard.innerHTML = `
            <div class="reward-icon">${reward.icon}</div>
            <h3>${reward.name}</h3>
            <p>${reward.description}</p>
          `;

            rewardCard.addEventListener("click", () => {
                console.log(`🎁 보상 선택: ${reward.name} (${reward.type})`);
                this.applyReward(reward);
                overlay.remove();

                // 턴 타이머 초기화 및 _giveUpTurnCount 0으로 초기화
                setTimer(startTimer());
                setGiveUpTurnCount(0);
            });

            cardsContainer.appendChild(rewardCard);
        });

        // 선택하지 않음 버튼 
        const noneSelectBtn = document.createElement("div");
        noneSelectBtn.innerHTML = "선택하지 않음";
        noneSelectBtn.classList.add("none-select-btn");
        noneSelectBtn.addEventListener("click", () => {
            // 클릭시 멈췄던 턴 타이머 계속 진행
            console.log("보상 선택 안함");
            setTimer(startTimer());
            overlay.remove();
        });

        container.appendChild(cardsContainer);
        overlay.appendChild(container);
        overlay.appendChild(noneSelectBtn);
        document.body.appendChild(overlay);
    }

    // 방치한 턴에 맞는 랜덤한 3개의 보상 선택지 생성
    // turn 수 보상에 맞는 랜덤한 rewardConut 개의 보상객체 배열 반환
    getRandomRewards(turn, rewardCount) {
        let rewards = [];
        let rewardOptions = this.rewardOptions[turn]; // 해당 턴의 보상객체 배열
        console.log("리워드 원본", rewardOptions);
        let rewardOptionsCopy = JSON.parse(JSON.stringify(rewardOptions)); // 복사본
        console.log("리워드 카피 필터링", rewardOptionsCopy);

        if (rewardOptions) {
            for (let i = rewardOptionsCopy.length; i > 0; i--) {
                // 0과 i 사이의 랜덤한 인덱스를 선택합니다.
                const j = Math.floor(Math.random() * (i + 1));
                [rewardOptionsCopy[i], rewardOptionsCopy[j]] = [rewardOptionsCopy[j], rewardOptionsCopy[i]];
            }
        }

        // console.log(rewardOptionsCopy);
        rewards = rewardOptionsCopy.slice(0, rewardCount);
        rewards = rewards.filter(item => item !== undefined);
        return rewards;
    }

    // 보상 적용
    applyReward(reward) {
        switch (reward.type) {
            case this.types.heal:
                this.heal(reward);
                break;

            case this.types.bonus_block:
                this.bonusTile(reward);
                break;

            default:
                console.log("알 수 없는 보상 타입:", reward.type);
                break;
        }
    }

    // 플레이어 체력 회복
    heal(reward) {
        console.log("체력 회복 ", reward.value);
        setHP(playerHP + reward.value);
    }

    // 
    bonusTile(reward) {
        console.log("보너스 타일 ", reward.value);
        setSequence(true);
    }


    initRewardOptions() {
        // 턴별 보상이 객체의 배열로 저장되어 있음
        // console.log(this.types);
        this.rewardOptions = {
            // 3턴 방치 보상
            3: [
                {
                    icon: "❤️",
                    name: "체력 회복 1",
                    description: "체력을 50 만큼 회복합니다.",
                    value: 50,
                    type: this.types.heal,
                },
                {
                    icon: "2️⃣",
                    name: "추가 블록",
                    description: "다음 1턴에는 타일을 2개 배치할 수 있습니다.",
                    value: 2,
                    type: this.types.bonus_block,
                }
            ],
            // 5턴 방치 보상
            5: [
                {
                    icon: "❤️",
                    name: "체력 회복 2",
                    description: "체력을 200 만큼 회복합니다.",
                    value: 200,
                    type: this.types.heal,
                }
            ],
            // 7턴 방치 보상
            7: [
                {
                    icon: "❤️",
                    name: "체력 회복 3",
                    description: "체력을 500 만큼 회복합니다.",
                    value: 500,
                    type: this.types.heal,
                }
            ]
        }
    }

}