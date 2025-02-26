<?php
$host = 'localhost'; // MySQL 서버가 같은 EC2 인스턴스에 있는 경우
$db = 'Reverse2048_DB';  // 생성한 데이터베이스 이름
$user = 'ubuntu';          // 생성한 MySQL 사용자 이름
$pass = '000012345';     // ubuntu 사용자의 비밀번호 (안전한 비밀번호로!)
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // POST 요청 데이터 받기
    $data = json_decode(file_get_contents('php://input'), true); // JSON 데이터 파싱


    // 누락된 필드를 저장할 배열
    $missingFields = [];

    // 각 필드를 개별적으로 검사하고, 누락된 경우 $missingFields 배열에 추가
    if (empty($data['nickname'])) {
        $missingFields[] = 'nickname';
    }
    if (empty($data['turn'])) {
        $missingFields[] = 'turn';
    }
    if (empty($data['formattedTime'])) {
        $missingFields[] = 'formattedTime';
    }

    // 누락된 필드가 있으면 오류 응답
    if (!empty($missingFields)) {
        http_response_code(400); // Bad Request

        // 누락된 필드 목록을 쉼표로 연결하여 메시지 생성
        $message = '필수 데이터가 누락되었습니다: ' . implode(', ', $missingFields);
        echo json_encode(['success' => false, 'message' => $message]);
        exit;
    }
    // 2. 닉네임 유효성 검사 (추가)
    // $nickname = $data['nickname'];

    // // 2-1. 닉네임 길이 검사 (바이트 단위)
    // if (mb_strlen($nickname, 'UTF-8') > 16) {  // 한글 최대 16자 (UTF-8 기준)
    //     http_response_code(400);
    //     echo json_encode(['success' => false, 'message' => '닉네임은 한글 최대 16자까지 입력 가능합니다.']);
    //     exit;
    // }

    // // 다른 문자 인코딩을 사용하는 경우 mb_strlen($nickname, '해당인코딩')으로 변경
    // if (strlen($nickname) > 32) { // 영어,숫자, 특수문자는 최대 32자
    //     http_response_code(400);
    //     echo json_encode(['success' => false, 'message' => '닉네임은 최대 32바이트까지 입력 가능합니다.']);
    //     exit;
    // }

    // // 2-2. 공백 포함 여부 검사
    // if (strpos($nickname, ' ') !== false) {
    //     http_response_code(400);
    //     echo json_encode(['success' => false, 'message' => '닉네임에는 공백을 포함할 수 없습니다.']);
    //     exit;
    // }

    // 랭킹 데이터 삽입
    $stmt = $pdo->prepare("INSERT INTO rankings (nickname, turn, play_time) VALUES (?, ?, ?)");
    $stmt->execute([$data['nickname'], $data['turn'], $data['formattedTime']]);

    // 성공 응답
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    // 오류 처리
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}