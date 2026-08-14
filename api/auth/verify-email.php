<?php
// api/auth/verify-email.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

header('Content-Type: application/json');

$token = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $token = trim($_GET['token'] ?? '');
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $token = trim($input['token'] ?? '');
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

if (empty($token)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Token verifikasi tidak ditemukan.']);
    exit;
}

$tokenHash = hash('sha256', $token);

try {
    // Look up user with matching valid token
    $stmt = $pdo->prepare("
        SELECT id, username, email, display_name, avatar, user_type, role, kelas, jurusan, mata_pelajaran, divisi, status, email_verified, verification_expires_at
        FROM users 
        WHERE verification_token_hash = ?
        LIMIT 1
    ");
    $stmt->execute([$tokenHash]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Token verifikasi tidak valid atau telah kedaluwarsa. Silakan minta tautan verifikasi baru.'
        ]);
        exit;
    }

    // Check expiration
    if (strtotime($user['verification_expires_at']) < time()) {
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

    // Generate JWT for seamless transition
    $jwtPayload = [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role']
    ];
    $jwtToken = generate_jwt($jwtPayload);

    $formattedUser = [
        'id' => $user['id'],
        'username' => $user['username'],
        'name' => $user['display_name'],
        'email' => $user['email'],
        'avatar' => $user['avatar'],
        'userType' => $user['user_type'],
        'role' => $user['role'],
        'kelas' => $user['kelas'],
        'jurusan' => $user['jurusan'],
        'mataPelajaran' => $user['mata_pelajaran'],
        'divisi' => $user['divisi'],
        'status' => $user['status'],
        'isVerified' => true,
        'emailVerified' => true
    ];

    echo json_encode([
        'success' => true,
        'message' => 'Selamat! Alamat email Anda telah berhasil diverifikasi. Akun MKVERSE Anda kini aktif.',
        'user' => $formattedUser,
        'token' => $jwtToken
    ]);

} catch (PDOException $e) {
    error_log("Verify Email Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem saat memverifikasi email.']);
}
