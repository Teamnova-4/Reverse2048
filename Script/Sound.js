// 전역 변수로 오디오 객체들을 관리할 맵 추가
const audioMap = new Map();
// let isSoundOn = true; // 사운드 켜짐/꺼짐 상태를 저장하는 변수
let isSoundOn = localStorage.getItem('isSoundOn') === 'true'; // 문자열 'true'와 비교

// 오디오 파일과 효과음 이름 매칭
function initAudio() {
    // 각 상황별 오디오 파일 등록
    audioMap.set('move', new Audio('../assets/sound/재배치.mp3'));
    // audioMap.set('merge', new Audio('./sound/병합.mp3'));
    audioMap.set('place', new Audio('../assets/sound/배치.mp3'));
    // audioMap.set('gameover', new Audio('./sound/게임오버.mp3'));
    audioMap.set('emergency', new Audio('../assets/sound/주의신호.mp3'));

    // 각 오디오 객체에 볼륨 설정 (초기 설정)
    audioMap.forEach(sound => {
        sound.volume = isSoundOn ? 1 : 0; // 사운드가 켜져 있으면 볼륨 1, 꺼져 있으면 0
    });
}

// 소리를 재생하는 함수
// soundType은 Sound.js의 initAudio에 등록되어 있음
export function playSound(soundType) {
    console.log(soundType, isSoundOn);
    if (!isSoundOn) return; // 사운드가 꺼져있으면 재생하지 않음

    const sound = audioMap.get(soundType);
    if (sound) {
        sound.currentTime = 0; // 재생 위치 초기화
        sound.play().catch(error => {
            console.log(`${soundType} 효과음 재생 실패:`, error);
        });
    }
}

// 사운드 켜고 끄는 함수
export function toggleSound() {
    isSoundOn = !isSoundOn; // 사운드 상태 토글

    // 로컬 스토리지에 사운드 설정 저장
    localStorage.setItem('isSoundOn', isSoundOn);

    // 오디오 볼륨 조절
    audioMap.forEach(sound => {
        sound.volume = isSoundOn ? 1 : 0; // 켜짐: 볼륨 1, 꺼짐: 볼륨 0
    });

    // UI 업데이트 (아이콘 변경)
    let speakerIcon = document.getElementById('speakerIcon');
    if (speakerIcon) {
        speakerIcon.classList.toggle('muted', !isSoundOn);
        speakerIcon.style.backgroundImage = isSoundOn
            ? "url('../assets/images/s_on.svg')"
            : "url('../assets/images/s_off.svg')";
        console.log(isSoundOn ? "사운드 켜짐" : "사운드 꺼짐");
    }
}

// DOMContentLoaded 이벤트에서 초기 설정 적용
window.addEventListener('DOMContentLoaded', () => {
    window.toggleSound = toggleSound;
    initAudio(); // 오디오 초기화는 DOMContentLoaded 이벤트 내에서 실행
    
    // 초기 UI 상태 설정
    let speakerIcon = document.getElementById('speakerIcon');
    if (speakerIcon) {
        speakerIcon.classList.toggle('muted', !isSoundOn);
        speakerIcon.style.backgroundImage = isSoundOn
            ? "url('../assets/images/s_on.svg')"
            : "url('../assets/images/s_off.svg')";
    }
});
