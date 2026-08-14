<?php
// api/config/database.php
// MySQL Connection using PDO for MKVERSE
require_once __DIR__ . '/env.php';

$db_host = get_env('DB_HOST', 'localhost');
$db_name = get_env('DB_NAME', 'mkversem_mkverse');
$db_user = get_env('DB_USER', 'mkversem_admin');
$db_pass = get_env('DB_PASSWORD', '');

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Koneksi database MySQL gagal: ' . $e->getMessage()]);
    exit;
}

