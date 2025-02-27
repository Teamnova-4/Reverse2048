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
    // 각 랭킹별 100개순위 제한 
    const limit = 100; 

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
        // 기본값은 4*4로 설정한다.
        h1Element.textContent = '[4X4] 랭킹 화면';
        document.title = "[4x4] 랭킹";
    }

    console.log('gameSize: ' + gameSize);

    try {
        const response = await fetch('./php/get_ranking.php', {
            method: 'POST', // POST 요청으로 변경
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameSize: gameSize, limit: limit }), // 요청 본문에 gameSize 추가
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
    document.querySelector('table').style.display = 'table';
}

function debouncedLoadRankings() {
    clearTimeout(loadRankingsTimeout); // 이전 타이머 제거
    loadRankingsTimeout = setTimeout(loadRankings, 500); // 500ms 후에 loadRankings 실행 (시간 조정 가능)
}


// 랭킹 크기 설정 및 페이지 새로고침
function setRankingSize(size) {
    localStorage.setItem('gameSize', size);
    console.log(`Ranking size set to ${size}x${size}, stored in localStorage as: ${localStorage.getItem('gameSize')}`);
    location.reload();
}

// 드롭다운 토글 기능
document.querySelector('.ranking-button').addEventListener('click', function (event) {
    event.stopPropagation();
    const dropdownContent = document.querySelector('.dropdown-content');
    dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
});

// 드롭다운 외부 클릭 시 닫기
document.addEventListener('click', function (event) {
    const dropdown = document.querySelector('.dropdown');
    if (!dropdown.contains(event.target)) {
        document.querySelector('.dropdown-content').style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', debouncedLoadRankings);