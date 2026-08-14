<?php
// api/users/register.php
// Registers a new user into MySQL database and sends verification email via SMTP
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/../config/security.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$fullName = trim($input['full_name'] ?? $input['name'] ?? $input['displayName'] ?? '');
$username = strtolower(trim($input['username'] ?? ''));
$email = strtolower(trim($input['email'] ?? ''));
$password = $input['password'] ?? $input['pass'] ?? '';
$confirmPassword = $input['confirm_password'] ?? $input['confirmPassword'] ?? $input['confirmPass'] ?? '';
$membershipStatus = trim($input['membership_status'] ?? $input['userType'] ?? 'Siswa');
$className = trim($input['class_name'] ?? $input['kelas'] ?? '');
$major = trim($input['major'] ?? $input['jurusan'] ?? '');
$mataPelajaran = trim($input['mata_pelajaran'] ?? $input['mataPelajaran'] ?? '');
$divisi = trim($input['divisi'] ?? '');

$clientIp = get_client_ip();

// Rate limiting on registration (max 10 registrations per hour per IP)
if (!check_rate_limit($pdo, 'register', $clientIp, 10, 3600)) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Terlalu banyak permintaan pendaftaran. Silakan coba lagi beberapa saat lagi.'
    ]);
    exit;
}

// 1. Validation
if (empty($fullName) || mb_strlen($fullName) < 2) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nama lengkap wajib diisi minimal 2 karakter.']);
    exit;
}

if (empty($username) || !preg_match('/^[a-z0-9_.]{3,30}$/', $username)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username hanya boleh huruf kecil, angka, titik, dan underscore (3-30 karakter).']);
    exit;
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format alamat email tidak valid.']);
    exit;
}

if (empty($password) || strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password minimal 8 karakter.']);
    exit;
}

if (!empty($confirmPassword) && $password !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Konfirmasi password tidak cocok dengan password.']);
    exit;
}

// 2. Check if email exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    record_rate_limit_attempt($pdo, 'register', $clientIp, 3600);
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.']);
    exit;
}

// 3. Check if username exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1");
$stmt->execute([$username]);
if ($stmt->fetch()) {
    record_rate_limit_attempt($pdo, 'register', $clientIp, 3600);
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Username @' . $username . ' sudah digunakan. Silakan pilih username lain.']);
    exit;
}

// 4. Hash password & Generate Verification Token
$passwordHash = password_hash($password, PASSWORD_BCRYPT);
$rawToken = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $rawToken);
$expiresAt = date('Y-m-d H:i:s', time() + 86400); // 24 hours validity

$userId = 'usr_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6);
$avatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($username);

try {
    $insert = $pdo->prepare("
        INSERT INTO users (
            id, full_name, display_name, username, email, password_hash,
            membership_status, user_type, class_name, kelas, major, jurusan,
            mata_pelajaran, divisi, profile_photo, avatar,
            role, status, email_verified, auth_provider,
            verification_token_hash, verification_expires_at, has_completed_profile
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            'USER', 'Active', 0, 'local',
            ?, ?, 1
        )
    ");

    $insert->execute([
        $userId,
        $fullName,
        $fullName,
        $username,
        $email,
        $passwordHash,
        $membershipStatus,
        $membershipStatus,
        $className ?: null,
        $className ?: null,
        $major ?: null,
        $major ?: null,
        $mataPelajaran ?: null,
        $divisi ?: null,
        $avatar,
        $avatar,
        $tokenHash,
        $expiresAt
    ]);

    // Send Verification Email via SMTP
    $mailConfig = get_mail_config();
    $verificationUrl = $mailConfig['app_url'] . '/verify-email?token=' . $rawToken;
    $emailHtml = get_verification_email_html($fullName, $verificationUrl);

    $mailSent = send_smtp_mail($email, $fullName, "Verifikasi Email Akun MKVERSE", $emailHtml);

    // Record rate limit attempt
    record_rate_limit_attempt($pdo, 'register', $clientIp, 3600);

    echo json_encode([
        'success' => true,
        'message' => 'Registrasi berhasil. Silakan verifikasi email Anda.',
        'email' => $email,
        'needsVerification' => true,
        'user' => [
            'id' => $userId,
            'full_name' => $fullName,
            'name' => $fullName,
            'username' => $username,
            'email' => $email,
            'membership_status' => $membershipStatus,
            'userType' => $membershipStatus,
            'class_name' => $className,
            'kelas' => $className,
            'major' => $major,
            'jurusan' => $major,
            'profile_photo' => $avatar,
            'avatar' => $avatar,
            'email_verified' => false,
            'isVerified' => false,
            'status' => 'Active'
        ]
    ]);
} catch (PDOException $e) {
    error_log("Register DB Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan pada server saat mendaftarkan akun.']);
}
