<?php
// api/users/login.php
// User login endpoint with password_verify and JWT generation
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../config/security.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$identifier = trim($input['username'] ?? $input['email'] ?? $input['emailOrUsername'] ?? '');
$password = $input['password'] ?? $input['pass'] ?? '';

if (empty($identifier) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email/Username dan Password wajib diisi.']);
    exit;
}

$clientIp = get_client_ip();
$rateKey = 'login_' . strtolower($identifier) . '_' . $clientIp;

// Check rate limit: 5 attempts per 15 minutes (900 seconds)
if (!check_rate_limit($pdo, 'login', $rateKey, 5, 900)) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Terlalu banyak percobaan login yang gagal. Demi keamanan akun Anda, silakan coba lagi dalam 15 menit.'
    ]);
    exit;
}

try {
    // Find user by email or username
    $stmt = $pdo->prepare("
        SELECT id, full_name, display_name, username, email, password_hash,
               membership_status, user_type, class_name, kelas, major, jurusan,
               mata_pelajaran, divisi, profile_photo, avatar, cover_image, bio,
               role, status, email_verified, google_id, auth_provider, has_completed_profile
        FROM users 
        WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)
        LIMIT 1
    ");
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();

    if (!$user || empty($user['password_hash']) || !password_verify($password, $user['password_hash'])) {
        record_rate_limit_attempt($pdo, 'login', $rateKey, 900);
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Email/Username atau password yang Anda masukkan salah.'
        ]);
        exit;
    }

    // Check account status
    if (isset($user['status']) && $user['status'] === 'Suspended') {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'isSuspended' => true,
            'message' => 'Akun MKVERSE Anda sedang ditangguhkan. Silakan hubungi pihak administrator sekolah.'
        ]);
        exit;
    }

    // Check if email is verified
    if ((int)$user['email_verified'] === 0) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'code' => 'EMAIL_NOT_VERIFIED',
            'needsVerification' => true,
            'email' => $user['email'],
            'message' => 'Silakan verifikasi email Anda terlebih dahulu.',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'full_name' => $user['full_name'] ?: $user['display_name'],
                'name' => $user['full_name'] ?: $user['display_name'],
                'email' => $user['email']
            ]
        ]);
        exit;
    }

    // Successful login: clear rate limit & update last_login
    clear_rate_limit($pdo, 'login', $rateKey);

    $updateLogin = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $updateLogin->execute([$user['id']]);

    // Generate JWT
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
        'cover_image' => $user['cover_image'],
        'coverImage' => $user['cover_image'],
        'bio' => $user['bio'],
        'role' => $user['role'],
        'mata_pelajaran' => $user['mata_pelajaran'],
        'mataPelajaran' => $user['mata_pelajaran'],
        'divisi' => $user['divisi'],
        'status' => $user['status'],
        'email_verified' => true,
        'isVerified' => true,
        'emailVerified' => true,
        'auth_provider' => $user['auth_provider'],
        'authProvider' => $user['auth_provider'],
        'hasCompletedProfile' => (bool)$user['has_completed_profile']
    ];

    echo json_encode([
        'success' => true,
        'message' => 'Login berhasil. Selamat datang kembali di MKVERSE!',
        'token' => $jwtToken,
        'user' => $formattedUser
    ]);

} catch (PDOException $e) {
    error_log("Login Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem saat memproses login.']);
}
