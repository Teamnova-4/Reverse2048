// 전역 변수로 오디오 객체들을 관리할 맵 추가
const audioMap = new Map();

// 오디오 파일과 효과음 이름 매칭
function initAudio() {
    // 각 상황별 오디오 파일 등록
    audioMap.set('move', new Audio('./sound/재배치.mp3'));
    // audioMap.set('merge', new Audio('./sound/병합.mp3'));
    audioMap.set('place', new Audio('./sound/배치.mp3'));
    // audioMap.set('gameover', new Audio('./sound/게임오버.mp3'));
}

// 소리를 재생하는 함수
// soundType은 Sound.js의 initAudio에 등록되어 있음
export function playSound(soundType) {
    const sound = audioMap.get(soundType);
    if (sound) {
        sound.currentTime = 0; // 재생 위치 초기화
        sound.play().catch(error => {
            console.log(`${soundType} 효과음 재생 실패:`, error);
        });
    }
}

// 오디오 초기화 실행
initAudio();