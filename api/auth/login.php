<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (empty($data->usernameOrEmail) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing username or password']);
    exit;
}

$identifier = strtolower(trim($data->usernameOrEmail));
$password = $data->password;

$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR username = ?");
$stmt->execute([$identifier, $identifier]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password_hash'])) {
    if ($user['status'] === 'Suspended') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Akun ditangguhkan.']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([$user['id']]);

    $token = generate_jwt(['id' => $user['id'], 'username' => $user['username'], 'role' => $user['role']]);

    unset($user['password_hash']);
    $user['name'] = $user['display_name'];

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'token' => $token,
        'user' => $user
    ]);
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Email/Username atau password salah.']);
}
