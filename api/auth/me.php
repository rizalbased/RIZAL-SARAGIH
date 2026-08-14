<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$authUser = get_auth_user();
if (!$authUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$authUser['id']]);
$user = $stmt->fetch();

if ($user) {
    unset($user['password_hash']);
    $user['name'] = $user['display_name'];
    $user['userType'] = $user['user_type'];
    echo json_encode(['success' => true, 'user' => $user]);
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'User not found']);
}
