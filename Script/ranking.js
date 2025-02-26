// 우클릭 방지
document.oncontextmenu = function () { return false; }

let loadRankingsTimeout;
let isload = false;
// 랭킹 데이터를 가져와서 테이블에 표시하는 함수
async function loadRankings() {
    if (isload) {
        console.log('랭킹 페이지 로딩중...');
        return;
    }
    isload = true;
    // 로컬 스토리지에서 맵 크기 가져옴
    const gameSize = localStorage.getItem('gameSize');

    // h1 요소의 텍스트 내용 설정 (맵 크기에 따라)
    const h1Element = document.querySelector('h1');
    if (gameSize === '3') {
        h1Element.textContent = '[3x3] 랭킹 화면';
        document.title = "[3x3] 랭킹"; // title도 변경
    } else if (gameSize === '4') {
        h1Element.textContent = '[4X4] 랭킹 화면';
        document.title = "[4x4] 랭킹";
    } else if (gameSize === '5') {
        h1Element.textContent = '[5X5] 랭킹 화면';
        document.title = "[5x5] 랭킹";
    } else {
        h1Element.textContent = '전체 랭킹 화면'; // gameSize가 null이거나 'all'인 경우
        document.title = "전체 랭킹";
    }

    try {
        const response = await fetch('./php/get_ranking.php', {
            method: 'POST', // POST 요청으로 변경
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameSize: gameSize }), // 요청 본문에 gameSize 추가
        });

        const result = await response.json();

        if (result.success) {
            displayRankings(result.data);
        } else {
            // 랭킹 데이터 가져오기 실패 처리
            console.error('[ranking.js] DB에서 데이터 랭킹 로드 실패:', result.message);
            alert('[ranking.js] DB에서 랭킹 데이터를 불러오는 데 실패했습니다: ' + result.message);
        }
    } catch (error) {
        // 네트워크 오류 등 예외 처리
        console.error('[ranking.js] 서버 오류:', error);
        alert('[ranking.js] 서버와 통신 중 오류가 발생했습니다: ' + error);
    } finally {
        isload = false;
    }
}

function displayRankings(rankings) {
    document.querySelector('table').style.display = 'table';
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';

    rankings.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${row.nickname}</td>
            <td>${row.turn}</td>
            <td>${row.play_time}</td>
        `;
        tbody.appendChild(tr);
    });


}

function debouncedLoadRankings() {
    clearTimeout(loadRankingsTimeout); // 이전 타이머 제거
    loadRankingsTimeout = setTimeout(loadRankings, 500); // 500ms 후에 loadRankings 실행 (시간 조정 가능)
}

document.addEventListener('DOMContentLoaded', debouncedLoadRankings);