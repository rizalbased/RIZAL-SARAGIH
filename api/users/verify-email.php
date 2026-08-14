<?php
// api/users/verify-email.php
// Validates email verification token, activates user, returns JSON and HTML landing option
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

$token = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $token = trim($_GET['token'] ?? '');
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $token = trim($input['token'] ?? '');
} else {
    header('Content-Type: application/json');
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$isHtmlRequest = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'text/html') !== false && !isset($_GET['format']);

if (empty($token)) {
    if ($isHtmlRequest) {
        render_verification_page(false, 'Token verifikasi tidak ditemukan.');
        exit;
    }
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Token verifikasi tidak ditemukan.']);
    exit;
}

$tokenHash = hash('sha256', $token);

try {
    // Look up user with matching token
    $stmt = $pdo->prepare("
        SELECT id, username, email, full_name, display_name, avatar, profile_photo,
               membership_status, user_type, role, class_name, kelas, major, jurusan,
               status, email_verified, verification_expires_at
        FROM users 
        WHERE verification_token_hash = ?
        LIMIT 1
    ");
    $stmt->execute([$tokenHash]);
    $user = $stmt->fetch();

    if (!$user) {
        if ($isHtmlRequest) {
            render_verification_page(false, 'Token verifikasi tidak valid atau telah kedaluwarsa.');
            exit;
        }
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Token verifikasi tidak valid atau telah kedaluwarsa. Silakan minta tautan verifikasi baru.'
        ]);
        exit;
    }

    // Check expiration
    if (strtotime($user['verification_expires_at']) < time()) {
        if ($isHtmlRequest) {
            render_verification_page(false, 'Tautan verifikasi telah kedaluwarsa (lebih dari 24 jam).');
            exit;
        }
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Tautan verifikasi telah kedaluwarsa (lebih dari 24 jam). Silakan minta tautan verifikasi baru.'
        ]);
        exit;
    }

    // Update user to verified
    $updateStmt = $pdo->prepare("
        UPDATE users 
        SET email_verified = 1, 
            verification_token_hash = NULL, 
            verification_expires_at = NULL,
            updated_at = NOW()
        WHERE id = ?
    ");
    $updateStmt->execute([$user['id']]);

    // Generate JWT for seamless session
    $jwtPayload = [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role']
    ];
    $jwtToken = generate_jwt($jwtPayload);

    $formattedUser = [
        'id' => $user['id'],
        'full_name' => $user['full_name'] ?: $user['display_name'],
        'name' => $user['full_name'] ?: $user['display_name'],
        'username' => $user['username'],
        'email' => $user['email'],
        'membership_status' => $user['membership_status'] ?: $user['user_type'],
        'userType' => $user['membership_status'] ?: $user['user_type'],
        'class_name' => $user['class_name'] ?: $user['kelas'],
        'kelas' => $user['class_name'] ?: $user['kelas'],
        'major' => $user['major'] ?: $user['jurusan'],
        'jurusan' => $user['major'] ?: $user['jurusan'],
        'profile_photo' => $user['profile_photo'] ?: $user['avatar'],
        'avatar' => $user['profile_photo'] ?: $user['avatar'],
        'role' => $user['role'],
        'status' => $user['status'],
        'email_verified' => true,
        'isVerified' => true,
        'emailVerified' => true
    ];

    if ($isHtmlRequest) {
        render_verification_page(true, 'Selamat! Alamat email Anda telah berhasil diverifikasi. Akun MKVERSE Anda kini aktif.');
        exit;
    }

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Selamat! Alamat email Anda telah berhasil diverifikasi. Akun MKVERSE Anda kini aktif.',
        'user' => $formattedUser,
        'token' => $jwtToken
    ]);

} catch (PDOException $e) {
    error_log("Verify Email Error: " . $e->getMessage());
    if ($isHtmlRequest) {
        render_verification_page(false, 'Terjadi kesalahan sistem saat memverifikasi email.');
        exit;
    }
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem saat memverifikasi email.']);
}

function render_verification_page($success, $message) {
    $title = $success ? 'Verifikasi Email Berhasil' : 'Verifikasi Gagal';
    $badgeBg = $success ? '#B8FF00' : '#EF4444';
    $badgeText = $success ? '✓ BERHASIL' : '✕ GAGAL';
    $appUrl = 'https://app.mkverse.my.id';
    echo <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$title} - MKVERSE</title>
  <style>
    body { margin:0; padding:0; background:#F5F5F0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; color:#0B0B0B; }
    .card { background:#FFF; border:3px solid #0B0B0B; border-radius:24px; box-shadow:8px 8px 0px 0px #0B0B0B; max-width:480px; width:90%; padding:32px; text-align:center; }
    .badge { display:inline-block; background:{$badgeBg}; color:#0B0B0B; font-weight:900; font-size:14px; padding:6px 16px; border-radius:12px; border:2px solid #0B0B0B; margin-bottom:16px; }
    .btn { display:inline-block; background:#B8FF00; color:#0B0B0B; font-weight:900; font-size:16px; text-decoration:none; padding:14px 28px; border-radius:16px; border:2px solid #0B0B0B; box-shadow:4px 4px 0px 0px #0B0B0B; margin-top:24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">{$badgeText}</div>
    <h1 style="font-size:24px; font-weight:900; margin:0 0 12px 0;">{$title}</h1>
    <p style="font-size:15px; color:#4B5563; line-height:1.6; margin:0;">{$message}</p>
    <a href="{$appUrl}" class="btn">Masuk ke MKVERSE →</a>
  </div>
</body>
</html>
HTML;
}
