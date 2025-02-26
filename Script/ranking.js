// 우클릭 방지
document.oncontextmenu = function () { return false; }

let loadRankingsTimeout;

// 랭킹 데이터를 가져와서 테이블에 표시하는 함수
async function loadRankings() {
    try {
        const response = await fetch('./php/get_ranking.php'); // get_rankings.php에 GET 요청
        const result = await response.json();

        if (result.success) {
            const tbody = document.querySelector('tbody'); // <tbody> 요소 선택
            tbody.innerHTML = ''; // 기존 테이블 내용 초기화 (새 데이터만 표시하기 위해)

            // DB에서 가져온 랭킹 데이터 (result.data)를 순회하며 테이블 행(<tr>) 생성
            result.data.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row.rank}</td>
                    <td>${row.nickname}</td>
                    <td>${row.turn}</td>
                    <td>${row.play_time}</td>
                `;
                tbody.appendChild(tr); // 생성된 행을 <tbody>에 추가
            });

            document.querySelector('table').style.display = 'table';
        } else {
            // 랭킹 데이터 가져오기 실패 처리
            console.error('[ranking.js] DB에서 데이터 랭킹 로드 실패:', result.message);
            alert('[ranking.js] DB에서 랭킹 데이터를 불러오는 데 실패했습니다: ' + result.message);
        }
    } catch (error) {
        // 네트워크 오류 등 예외 처리
        console.error('[ranking.js] 서버 오류:', error);
        alert('[ranking.js] 서버와 통신 중 오류가 발생했습니다: ' + error);
    }
}

function debouncedLoadRankings() {
    clearTimeout(loadRankingsTimeout); // 이전 타이머 제거
    loadRankingsTimeout = setTimeout(loadRankings, 500); // 500ms 후에 loadRankings 실행 (시간 조정 가능)
}

document.addEventListener('DOMContentLoaded', debouncedLoadRankings);