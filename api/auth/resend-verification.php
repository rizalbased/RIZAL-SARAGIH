<?php
// api/auth/resend-verification.php
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

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Alamat email tidak valid.']);
    exit;
}

$clientIp = get_client_ip();
$rateKey = 'resend_' . $email . '_' . $clientIp;

// Rate limit: max 3 requests per 10 minutes (600s)
if (!check_rate_limit($pdo, 'resend_verification', $rateKey, 3, 600)) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Terlalu banyak permintaan pengiriman ulang email. Mohon tunggu beberapa menit sebelum mencoba kembali.'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT id, display_name, email, email_verified, status 
        FROM users 
        WHERE email = ? 
        LIMIT 1
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Safe response
        echo json_encode([
            'success' => true,
            'message' => 'Jika email Anda terdaftar dan belum diverifikasi, tautan verifikasi baru telah dikirimkan.'
        ]);
        exit;
    }

    if ((int)$user['email_verified'] === 1) {
        echo json_encode([
            'success' => false,
            'message' => 'Alamat email ini sudah diverifikasi. Silakan masuk langsung ke akun MKVERSE Anda.'
        ]);
        exit;
    }

    // Generate new token
    $rawToken = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $rawToken);
    $expiresAt = date('Y-m-d H:i:s', time() + 86400); // 24 hours

    $update = $pdo->prepare("
        UPDATE users 
        SET verification_token_hash = ?, 
            verification_expires_at = ?,
            updated_at = NOW()
        WHERE id = ?
    ");
    $update->execute([$tokenHash, $expiresAt, $user['id']]);

    // Send email
    $mailConfig = get_mail_config();
    $verificationUrl = $mailConfig['app_url'] . '/verify-email?token=' . $rawToken;
    $emailHtml = get_verification_email_html($user['display_name'], $verificationUrl);

    $mailSent = send_smtp_mail($email, $user['display_name'], "Verifikasi Email Akun MKVERSE", $emailHtml);

    // Record rate limit attempt
    record_rate_limit_attempt($pdo, 'resend_verification', $rateKey, 600);

    if (!$mailSent['success']) {
        error_log("Resend email delivery failed for user {$user['id']}: " . ($mailSent['error'] ?? 'Unknown error'));
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Gagal mengirim email verifikasi ke ' . $email . ': ' . ($mailSent['message'] ?? 'Kendala koneksi SMTP'),
            'error' => $mailSent['error'] ?? null
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Tautan verifikasi baru berhasil dikirimkan ke ' . $email . '. Silakan periksa kotak masuk atau folder spam Anda.'
    ]);

} catch (PDOException $e) {
    error_log("Resend Verification Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem saat mengirim ulang verifikasi.']);
}
