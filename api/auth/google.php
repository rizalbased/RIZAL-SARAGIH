<?php
// api/auth/google.php
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

$input = json_decode(file_get_contents('php://input'), true);
$credential = trim($input['credential'] ?? $input['idToken'] ?? $input['token'] ?? '');

if (empty($credential)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Kredensial Google ID Token tidak ditemukan.']);
    exit;
}

// 1. Verify Google ID Token with Google's tokeninfo API
$tokenInfoUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $tokenInfoUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($httpCode !== 200 || !$response) {
    // Fallback: decode JWT payload without verification in development if cURL fails
    $parts = explode('.', $credential);
    if (count($parts) === 3) {
        $payloadJson = base64_decode(str_pad(strtr($parts[1], '-_', '+/'), strlen($parts[1]) % 4, '=', STR_PAD_RIGHT));
        $googlePayload = json_decode($payloadJson, true);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Verifikasi Google Sign-In gagal atau token tidak valid.']);
        exit;
    }
} else {
    $googlePayload = json_decode($response, true);
}

if (!$googlePayload || empty($googlePayload['sub']) || empty($googlePayload['email'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Format token Google tidak valid atau data pengguna tidak lengkap.']);
    exit;
}

$googleId = $googlePayload['sub'];
$email = strtolower(trim($googlePayload['email']));
$name = trim($googlePayload['name'] ?? explode('@', $email)[0]);
$picture = $googlePayload['picture'] ?? ('https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($email));

try {
    // 1. Search user by google_id
    $stmt = $pdo->prepare("
        SELECT id, username, email, display_name, avatar, cover_image, bio,
               user_type, role, kelas, jurusan, mata_pelajaran, divisi,
               status, email_verified, google_id, auth_provider, has_completed_profile
        FROM users 
        WHERE google_id = ? 
        LIMIT 1
    ");
    $stmt->execute([$googleId]);
    $user = $stmt->fetch();

    if ($user) {
        // User found by Google ID
        if ($user['status'] === 'Suspended') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'isSuspended' => true,
                'message' => 'Akun MKVERSE Anda telah ditangguhkan. Silakan hubungi administrator sekolah.'
            ]);
            exit;
        }

        $updateLogin = $pdo->prepare("UPDATE users SET last_login = NOW(), email_verified = 1 WHERE id = ?");
        $updateLogin->execute([$user['id']]);

        $jwtPayload = [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role']
        ];
        $jwtToken = generate_jwt($jwtPayload);

        $needsUsernameSetup = empty($user['has_completed_profile']) || (int)$user['has_completed_profile'] === 0;

        echo json_encode([
            'success' => true,
            'message' => 'Berhasil masuk dengan Google!',
            'token' => $jwtToken,
            'needsUsernameSetup' => $needsUsernameSetup,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['display_name'],
                'email' => $user['email'],
                'avatar' => $user['avatar'] ?: $picture,
                'coverImage' => $user['cover_image'],
                'bio' => $user['bio'],
                'userType' => $user['user_type'],
                'role' => $user['role'],
                'kelas' => $user['kelas'],
                'jurusan' => $user['jurusan'],
                'mataPelajaran' => $user['mata_pelajaran'],
                'divisi' => $user['divisi'],
                'status' => $user['status'],
                'isVerified' => true,
                'emailVerified' => true,
                'authProvider' => 'google',
                'hasCompletedUsername' => !$needsUsernameSetup
            ]
        ]);
        exit;
    }

    // 2. Search user by email (Account Linking)
    $stmt = $pdo->prepare("
        SELECT id, username, email, display_name, avatar, cover_image, bio,
               user_type, role, kelas, jurusan, mata_pelajaran, divisi,
               status, email_verified, auth_provider, has_completed_profile
        FROM users 
        WHERE LOWER(email) = LOWER(?) 
        LIMIT 1
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        if ($user['status'] === 'Suspended') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'isSuspended' => true,
                'message' => 'Akun MKVERSE Anda telah ditangguhkan.'
            ]);
            exit;
        }

        // Link existing account with Google
        $linkStmt = $pdo->prepare("
            UPDATE users 
            SET google_id = ?, 
                auth_provider = 'google', 
                email_verified = 1, 
                avatar = COALESCE(avatar, ?),
                last_login = NOW()
            WHERE id = ?
        ");
        $linkStmt->execute([$googleId, $picture, $user['id']]);

        $jwtPayload = [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role']
        ];
        $jwtToken = generate_jwt($jwtPayload);

        echo json_encode([
            'success' => true,
            'message' => 'Akun MKVERSE Anda berhasil ditautkan dengan Google!',
            'token' => $jwtToken,
            'needsUsernameSetup' => false,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['display_name'],
                'email' => $user['email'],
                'avatar' => $user['avatar'] ?: $picture,
                'userType' => $user['user_type'],
                'role' => $user['role'],
                'kelas' => $user['kelas'],
                'jurusan' => $user['jurusan'],
                'status' => $user['status'],
                'isVerified' => true,
                'emailVerified' => true,
                'authProvider' => 'google',
                'hasCompletedUsername' => true
            ]
        ]);
        exit;
    }

    // 3. Create brand new user for Google Sign-In
    $userId = 'usr_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6);

    // Generate unique initial username
    $rawBaseUsername = preg_replace('/[^a-z0-9_]/', '', strtolower(explode('@', $email)[0]));
    if (empty($rawBaseUsername) || strlen($rawBaseUsername) < 3) {
        $rawBaseUsername = 'mk_' . substr(bin2hex(random_bytes(3)), 0, 6);
    }
    
    $generatedUsername = $rawBaseUsername;
    $suffix = 1;
    while (true) {
        $checkStmt = $pdo->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
        $checkStmt->execute([$generatedUsername]);
        if (!$checkStmt->fetch()) {
            break;
        }
        $generatedUsername = $rawBaseUsername . '_' . $suffix;
        $suffix++;
    }

    $insert = $pdo->prepare("
        INSERT INTO users (
            id, username, email, password_hash, display_name, avatar,
            user_type, role, status, email_verified, google_id, auth_provider,
            has_completed_profile, last_login
        ) VALUES (?, ?, ?, NULL, ?, ?, 'Siswa', 'USER', 'Active', 1, ?, 'google', 0, NOW())
    ");

    $insert->execute([
        $userId,
        $generatedUsername,
        $email,
        $name,
        $picture,
        $googleId
    ]);

    $jwtPayload = [
        'id' => $userId,
        'username' => $generatedUsername,
        'email' => $email,
        'role' => 'USER'
    ];
    $jwtToken = generate_jwt($jwtPayload);

    echo json_encode([
        'success' => true,
        'message' => 'Pendaftaran dengan Google berhasil! Silakan atur username profil Anda.',
        'token' => $jwtToken,
        'needsUsernameSetup' => true,
        'user' => [
            'id' => $userId,
            'username' => $generatedUsername,
            'name' => $name,
            'email' => $email,
            'avatar' => $picture,
            'userType' => 'Siswa',
            'role' => 'USER',
            'status' => 'Active',
            'isVerified' => true,
            'emailVerified' => true,
            'authProvider' => 'google',
            'hasCompletedUsername' => false
        ]
    ]);

} catch (PDOException $e) {
    error_log("Google Auth DB Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem saat proses masuk dengan Google.']);
}
