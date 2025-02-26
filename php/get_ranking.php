<?php
header('Content-Type: application/json');

$host = 'localhost';
$db = 'Reverse2048_DB';
$user = 'ubuntu';
$pass = '000012345';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // 1. POST 요청의 body에서 gameSize 가져오기
    $requestData = json_decode(file_get_contents('php://input'), true);
    $gameSize = $requestData['gameSize'] ?? null; // 'gameSize' 키가 없으면 null

    // 2. 기본 쿼리 (전체 랭킹)
    $sql = "SELECT nickname, turn, play_time, created_at, mapSize FROM rankings";
    $params = [];

    // 3. gameSize가 있고, 'all'이 아니면 WHERE 절 추가
    if ($gameSize && $gameSize !== 'all') {
        $sql .= " WHERE mapSize = :size";
        $params[':size'] = $gameSize;
    }

    // 4. 정렬 및 LIMIT
    $sql .= " ORDER BY turn ASC, play_time ASC, created_at ASC LIMIT 100";

    // 5. Prepared Statement 실행
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $rankings = $stmt->fetchAll();

    // 6. 순위 추가
    foreach ($rankings as $index => &$ranking) {
        $ranking['rank'] = $index + 1;
    }

    echo json_encode(['success' => true, 'data' => $rankings]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>