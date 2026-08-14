<?php
require_once '../config/cors.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (empty($data->email) || empty($data->password) || empty($data->username)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$email = strtolower(trim($data->email));
$username = strtolower(trim($data->username));
$password = $data->password;
$display_name = !empty($data->name) ? trim($data->name) : $username;
$user_type = !empty($data->userType) ? $data->userType : 'Siswa';

// Check if email or username exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
$stmt->execute([$email, $username]);
if ($stmt->rowCount() > 0) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Email atau Username sudah digunakan.']);
    exit;
}

$id = uniqid('usr_');
$password_hash = password_hash($password, PASSWORD_BCRYPT);
$avatar = !empty($data->avatar) ? $data->avatar : "https://api.dicebear.com/7.x/bottts/svg?seed=$id";

$stmt = $pdo->prepare("INSERT INTO users (id, username, email, password_hash, display_name, avatar, user_type) VALUES (?, ?, ?, ?, ?, ?, ?)");
if ($stmt->execute([$id, $username, $email, $password_hash, $display_name, $avatar, $user_type])) {
    http_response_code(201);
    echo json_encode(['success' => true, 'message' => 'Registration successful']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Registration failed']);
}
