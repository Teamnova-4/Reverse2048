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
    $mapSize = $requestData['gameSize'] ?? null; // 'gameSize' 키가 없으면 null
    $limit = $requestData['limit'] ?? 100; // 100등 제한


    // 입력값 검증
    if (!is_numeric($limit) || $limit <= 0) {
        die(json_encode(['success' => false, 'message' => 'Invalid limit value']));
    }

    // 2. 기본 쿼리 (전체 랭킹)
    $sql = "SELECT nickname, turn, play_time, created_at, mapSize FROM rankings";
    $params = [];

    // 3. gameSize가 있고, 'all'이 아니면 WHERE 절 추가
    if ($mapSize && $mapSize !== 'all') {
        $sql .= " WHERE mapSize = :size";
        $params[':size'] = $mapSize;
    }

    // 4. 정렬 및 LIMIT
    // play_time이 MM:SS 형식이므로 STR_TO_DATE('%i:%s') 사용
    $sql .= " ORDER BY turn ASC, STR_TO_DATE(play_time, '%i:%s') ASC, created_at ASC LIMIT :limit";
    $params[':limit'] = $limit; // limit 파라미터 바인딩

    // 5. Prepared Statement 실행
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $rankings = $stmt->fetchAll();

    foreach ($rankings as $index => &$ranking) {
        $ranking['rank'] = $index + 1;
    }

    echo json_encode(['success' => true, 'data' => $rankings]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>