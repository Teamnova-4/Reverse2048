<?php
// 데이터베이스 연결 설정 (실제 정보로 변경!)
$host = 'localhost';
$db   = 'Reverse2048_DB';
$user = 'ubuntu';
$pass = '000012345';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // POST 요청 데이터 받기
    $data = json_decode(file_get_contents('php://input'), true);

    // 데이터 유효성 검사 (간단한 예시)
      if (empty($data['nickname']) || empty($data['turn']) || !isset($data['score'])) {
        throw new Exception('필수 데이터가 누락되었습니다.');
    }

    // 닉네임 중복 검사 (데이터베이스에 따라)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM rankings WHERE nickname = ?");
    $stmt->execute([$data['nickname']]);
    if ($stmt->fetchColumn() > 0) {
        throw new Exception('이미 사용 중인 닉네임입니다.');
    }

    // 데이터베이스에 삽입 (테이블 이름, 컬럼명 확인!)
    $stmt = $pdo->prepare("INSERT INTO rankings (nickname, turn, score) VALUES (?, ?, ?)");
    $stmt->execute([$data['nickname'], $data['turn'], $data['score']]);


    // 성공 응답
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    // 오류 처리
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}