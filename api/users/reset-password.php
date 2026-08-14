<?php
// api/users/reset-password.php
// Validates reset token and updates password in MySQL
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$token = trim($input['token'] ?? '');
$newPassword = $input['new_password'] ?? $input['password'] ?? $input['newPassword'] ?? $input['pass'] ?? '';
$confirmPassword = $input['confirm_password'] ?? $input['confirmPassword'] ?? $input['confirmPass'] ?? '';

if (empty($token)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Token reset password tidak ditemukan.']);
    exit;
}

if (empty($newPassword) || strlen($newPassword) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password baru minimal 8 karakter.']);
    exit;
}

if (!empty($confirmPassword) && $newPassword !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Konfirmasi password tidak cocok.']);
    exit;
}

$tokenHash = hash('sha256', $token);

try {
    // Find user by valid reset token
    $stmt = $pdo->prepare("
        SELECT id, username, email, full_name, display_name, reset_expires_at
        FROM users 
        WHERE reset_token_hash = ?
        LIMIT 1
    ");
    $stmt->execute([$tokenHash]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Token reset password tidak valid atau sudah pernah digunakan. Silakan minta tautan baru.'
        ]);
        exit;
    }

    if (strtotime($user['reset_expires_at']) < time()) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Tautan reset password telah kedaluwarsa (lebih dari 60 menit). Silakan ajukan reset password baru.'
        ]);
        exit;
    }

    // Hash new password using password_hash
    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);

    $update = $pdo->prepare("
        UPDATE users 
        SET password_hash = ?, 
            reset_token_hash = NULL, 
            reset_expires_at = NULL,
            updated_at = NOW() 
        WHERE id = ?
    ");
    $update->execute([$newHash, $user['id']]);

    echo json_encode([
        'success' => true,
        'message' => 'Kata sandi berhasil diperbarui! Anda sekarang dapat masuk ke MKVERSE menggunakan kata sandi baru Anda.'
    ]);

} catch (PDOException $e) {
    error_log("Reset Password Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem saat memperbarui kata sandi.']);
}
