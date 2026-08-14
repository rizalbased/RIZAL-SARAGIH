<?php
// api/users/forgot-password.php
// Generates password reset token and sends link via Gmail SMTP
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/../config/security.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$email = strtolower(trim($input['email'] ?? ''));

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format alamat email tidak valid.']);
    exit;
}

$clientIp = get_client_ip();
$rateKey = 'forgot_' . $email . '_' . $clientIp;

// Rate limit: max 3 attempts per 15 minutes (900 seconds)
if (!check_rate_limit($pdo, 'forgot_password', $rateKey, 3, 900)) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Terlalu banyak permintaan reset password. Silakan coba lagi beberapa saat lagi.'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, full_name, display_name, email, status FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && $user['status'] !== 'Suspended') {
        $rawToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $rawToken);
        $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour expiration

        $update = $pdo->prepare("
            UPDATE users 
            SET reset_token_hash = ?, 
                reset_expires_at = ?,
                updated_at = NOW() 
            WHERE id = ?
        ");
        $update->execute([$tokenHash, $expiresAt, $user['id']]);

        // Send Email
        $mailConfig = get_mail_config();
        $resetUrl = 'https://app.mkverse.my.id/reset-password?token=' . $rawToken;
        $userName = $user['full_name'] ?: $user['display_name'];
        $emailHtml = get_reset_password_email_html($userName, $resetUrl);

        send_smtp_mail($email, $userName, "Reset Password Akun MKVERSE", $emailHtml);

        record_rate_limit_attempt($pdo, 'forgot_password', $rateKey, 900);
    }

    // Always return generic safe response to prevent user enumeration
    echo json_encode([
        'success' => true,
        'message' => 'Jika alamat email tersebut terdaftar di MKVERSE, kami telah mengirimkan tautan reset kata sandi ke kotak masuk Anda. Silakan periksa email Anda (termasuk folder spam).'
    ]);

} catch (PDOException $e) {
    error_log("Forgot Password Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem saat memproses permintaan reset password.']);
}
