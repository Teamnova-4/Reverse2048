<?php
// HTTP 응답 헤더를 설정합니다. 이 코드는 클라이언트(웹 브라우저)에게
// 서버가 보내는 데이터가 JSON 형식임을 알려줍니다.
header('Content-Type: application/json');

// 데이터베이스 연결 정보 (MySQL 서버 주소, 데이터베이스 이름, 사용자 이름, 비밀번호, 문자 인코딩)
$host = 'localhost';
$db = 'Reverse2048_DB';
$user = 'ubuntu';
$pass = '000012345';
$charset = 'utf8mb4';

// 데이터베이스 연결 문자열 (DSN: Data Source Name)을 생성합니다.
// 이 문자열은 PDO가 어떤 데이터베이스에 어떻게 연결할지 지정합니다.
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

// PDO (PHP Data Objects) 연결 옵션을 설정합니다.
$options = [
    // 에러 처리 모드를 예외(Exception) 처리 모드로 설정합니다.
    // 오류가 발생하면 PDOException 예외가 발생합니다.
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,

    // 데이터를 가져올 때 연관 배열(Associative Array) 형태로 가져오도록 설정합니다.
    // 예: ['nickname' => 'player1', 'turn' => 10, ...]
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

    // prepared statement 에뮬레이션을 끕니다.
    // 실제 MySQL 서버의 prepared statement 기능을 사용하도록 합니다. (보안 및 성능 향상)
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    // PDO 객체를 생성하여 데이터베이스에 연결합니다.
    // 연결 정보와 옵션을 사용하여 연결을 설정합니다.
    $pdo = new PDO($dsn, $user, $pass, $options);

    // SQL 쿼리를 실행하여 랭킹 데이터를 가져옵니다.
    // rankings 테이블에서 nickname, turn, score, play_time, created_at 열을 선택합니다.
    // ORDER BY 절을 사용하여 정렬합니다:
    //   1. turn ASC (턴 수가 적은 순서, 오름차순) - 가장 중요
    //   2. score DESC (점수가 높은 순서, 내림차순)
    //   3. play_time ASC (플레이 시간이 짧은 순서, 오름차순)
    //   4. created_at ASC (등록 시간이 빠른 순서, 오름차순)

    // LIMIT 100을 사용하여 최대 100개의 랭킹 데이터만 가져옵니다.
    // 수정된 SQL 쿼리: turn, play_time, created_at 만으로 정렬 (score 제외)
    $stmt = $pdo->query("SELECT nickname, turn, play_time, created_at
                        FROM rankings
                        ORDER BY turn ASC, play_time ASC, created_at ASC
                        LIMIT 100");

    // 쿼리 결과를 모두 가져와 $rankings 배열에 저장합니다.
    // PDO::FETCH_ASSOC 옵션에 따라 각 랭킹 데이터는 연관 배열 형태로 저장됩니다.
    $rankings = $stmt->fetchAll();

    // 가져온 랭킹 데이터에 순위를 추가합니다.
    foreach ($rankings as $index => &$ranking) {
        // $index는 0부터 시작하는 배열 인덱스이므로, 1을 더하여 등수를 계산합니다.
        $ranking['rank'] = $index + 1;
    }

    // 랭킹 데이터를 JSON 형식으로 인코딩하여 클라이언트에 응답합니다.
    // ['success' => true, 'data' => $rankings] 형태의 배열을 JSON으로 변환합니다.
    echo json_encode(['success' => true, 'data' => $rankings]);

} catch (Exception $e) {
    // 데이터베이스 연결 또는 쿼리 실행 중 오류가 발생하면 이 블록이 실행됩니다.

    // HTTP 응답 코드를 500 (Internal Server Error)으로 설정합니다.
    http_response_code(500);

    // 오류 메시지를 JSON 형식으로 인코딩하여 클라이언트에 응답합니다.
    // ['success' => false, 'message' => '오류 메시지'] 형태의 배열을 JSON으로 변환합니다.
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>