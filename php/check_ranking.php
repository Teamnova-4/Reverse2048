<?php
// 응답 헤더를 JSON 형식으로 설정합니다. 클라이언트에게 JSON 데이터를 보낼 것임을 알려줍니다.
header('Content-Type: application/json');

// 데이터베이스 연결 정보
$host = 'localhost';   // 데이터베이스 호스트 주소 (현재 서버와 동일한 경우 'localhost')
$db = 'Reverse2048_DB';  // 데이터베이스 이름
$user = 'ubuntu';      // 데이터베이스 사용자 이름
$pass = '000012345';     // 데이터베이스 사용자 비밀번호
$charset = 'utf8mb4';   // 문자 인코딩 (한글 등을 지원하기 위해 utf8mb4 사용)

// 데이터베이스 연결 문자열(DSN) 생성
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

// PDO(PHP Data Objects) 연결 옵션 설정
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // 예외(Exception)를 통해 오류 처리
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // 결과를 연관 배열 형태로 가져옴
    PDO::ATTR_EMULATE_PREPARES => false, // Prepared Statement 에뮬레이션 끔 (보안 및 성능 향상)
];

// PDO를 사용하여 데이터베이스 연결
try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // 클라이언트로부터 JSON 형식의 데이터를 받아서 PHP 배열로 변환
    $data = json_decode(file_get_contents('php://input'), true);

    if (
        !isset($data['turn'], $data['formattedTime']) ||
        !is_numeric($data['turn']) ||
        !is_string($data['formattedTime'])
    ) { // formattedTime이 문자열인지 확인
        die(json_encode(['error' => 'Invalid input data']));
    }


    // 클라이언트로부터 받은 turn 값을 정수로 변환
    $turn = (int) $data['turn'];
    // 클라이언트로부터 받은 formattedTime 값을 playTime 변수에 저장 (문자열)
    $playTime = $data['formattedTime'];

    // 100위 안에 드는 기록의 개수를 세는 쿼리
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt 
    FROM rankings 
    WHERE turn < ? OR (turn = ? AND play_time < ?)");
    $stmt->execute([$turn, $turn, $playTime]);
    $result = $stmt->fetch();
    $count = $result['cnt'];

    // 100등 기록이 존재하는지 확인
    // 새로운 기록이 100위 안에 들 수 있는지 확인
    $canRegister = ($count < 100);

    if ($canRegister) {
        $canRegister = true;
    } else {
        $canRegister = false;
    }
    // 랭킹 등록 가능 여부를 JSON 형식으로 인코딩하여 클라이언트에 반환
    echo json_encode([
        'canRegister' => $canRegister,
        'success' => true,
        'count' => $count
    ]);

} catch (Exception $e) {
    // 오류 처리
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>