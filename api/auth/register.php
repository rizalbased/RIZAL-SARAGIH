<?php
// api/auth/register.php
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

$input = json_decode(file_get_contents('php://input'), true);

$name = trim($input['name'] ?? $input['displayName'] ?? '');
$username = strtolower(trim($input['username'] ?? ''));
$email = strtolower(trim($input['email'] ?? ''));
$password = $input['pass'] ?? $input['password'] ?? '';
$confirmPassword = $input['confirmPass'] ?? $input['confirmPassword'] ?? '';
$userType = trim($input['userType'] ?? 'Siswa');
$role = trim($input['role'] ?? 'USER');
$kelas = trim($input['kelas'] ?? '');
$jurusan = trim($input['jurusan'] ?? '');
$mataPelajaran = trim($input['mataPelajaran'] ?? '');
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
if (empty($name) || strlen($name) < 2) {
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
$stmt = $pdo->prepare("SELECT id, email_verified FROM users WHERE email = ? LIMIT 1");
$stmt->execute([$email]);
$existingEmailUser = $stmt->fetch();

if ($existingEmailUser) {
    record_rate_limit_attempt($pdo, 'register', $clientIp, 3600);
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.']);
    exit;
}

// 3. Check if username exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
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
$expiresAt = date('Y-m-d H:i:s', time() + 86400); // 24 hours

$userId = 'usr_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6);
$avatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($username);

try {
    $insert = $pdo->prepare("
        INSERT INTO users (
            id, username, email, password_hash, display_name, avatar,
            user_type, role, kelas, jurusan, mata_pelajaran, divisi,
            status, email_verified, auth_provider,
            verification_token_hash, verification_expires_at, has_completed_profile
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 0, 'local', ?, ?, 1)
    ");

    $insert->execute([
        $userId,
        $username,
        $email,
        $passwordHash,
        $name,
        $avatar,
        $userType,
        $role,
        $kelas ?: null,
        $jurusan ?: null,
        $mataPelajaran ?: null,
        $divisi ?: null,
        $tokenHash,
        $expiresAt
    ]);

    // Send Verification Email via SMTP
    $mailConfig = get_mail_config();
    $verificationUrl = $mailConfig['app_url'] . '/verify-email?token=' . $rawToken;
    $emailHtml = get_verification_email_html($name, $verificationUrl);

    $mailSent = send_smtp_mail($email, $name, "Verifikasi Email Akun MKVERSE", $emailHtml);

    // Record rate limit attempt
    record_rate_limit_attempt($pdo, 'register', $clientIp, 3600);

    echo json_encode([
        'success' => true,
        'message' => 'Pendaftaran berhasil! Silakan periksa email Anda (' . $email . ') untuk melakukan verifikasi akun.',
        'email' => $email,
        'needsVerification' => true,
        'user' => [
            'id' => $userId,
            'username' => $username,
            'name' => $name,
            'email' => $email,
            'userType' => $userType,
            'role' => $role,
            'avatar' => $avatar,
            'kelas' => $kelas,
            'jurusan' => $jurusan,
            'isVerified' => false,
            'emailVerified' => false,
            'status' => 'Active'
        ]
    ]);
} catch (PDOException $e) {
    error_log("Register DB Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan pada server saat mendaftarkan akun.']);
}
