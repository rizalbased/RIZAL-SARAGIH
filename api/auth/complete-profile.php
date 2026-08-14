<?php
// api/auth/complete-profile.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$authUser = get_auth_user();
if (!$authUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$newUsername = strtolower(trim($input['username'] ?? ''));
$userType = trim($input['userType'] ?? 'Siswa');
$kelas = trim($input['kelas'] ?? '');
$jurusan = trim($input['jurusan'] ?? '');
$mataPelajaran = trim($input['mataPelajaran'] ?? '');
$divisi = trim($input['divisi'] ?? '');

if (empty($newUsername) || !preg_match('/^[a-z0-9_.]{3,30}$/', $newUsername)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username hanya boleh mengandung huruf kecil, angka, titik, dan underscore (3-30 karakter).']);
    exit;
}

try {
    // Check if username taken by another user
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1");
    $stmt->execute([$newUsername, $authUser['id']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Username @' . $newUsername . ' sudah digunakan. Silakan pilih username lain.']);
        exit;
    }

    $update = $pdo->prepare("
        UPDATE users 
        SET username = ?,
            user_type = ?,
            kelas = ?,
            jurusan = ?,
            mata_pelajaran = ?,
            divisi = ?,
            has_completed_profile = 1,
            updated_at = NOW()
        WHERE id = ?
    ");

    $update->execute([
        $newUsername,
        $userType,
        $kelas ?: null,
        $jurusan ?: null,
        $mataPelajaran ?: null,
        $divisi ?: null,
        $authUser['id']
    ]);

    // Fetch updated user
    $getStmt = $pdo->prepare("SELECT id, username, email, display_name, avatar, cover_image, bio, user_type, role, kelas, jurusan, mata_pelajaran, divisi, status, email_verified, auth_provider FROM users WHERE id = ?");
    $getStmt->execute([$authUser['id']]);
    $updated = $getStmt->fetch();

    // Re-issue JWT with new username
    $newJwt = generate_jwt([
        'id' => $updated['id'],
        'username' => $updated['username'],
        'email' => $updated['email'],
        'role' => $updated['role']
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Profil berhasil dilengkapi!',
        'token' => $newJwt,
        'user' => [
            'id' => $updated['id'],
            'username' => $updated['username'],
            'name' => $updated['display_name'],
            'email' => $updated['email'],
            'avatar' => $updated['avatar'],
            'coverImage' => $updated['cover_image'],
            'bio' => $updated['bio'],
            'userType' => $updated['user_type'],
            'role' => $updated['role'],
            'kelas' => $updated['kelas'],
            'jurusan' => $updated['jurusan'],
            'mataPelajaran' => $updated['mata_pelajaran'],
            'divisi' => $updated['divisi'],
            'status' => $updated['status'],
            'isVerified' => true,
            'emailVerified' => true,
            'authProvider' => $updated['auth_provider'],
            'hasCompletedUsername' => true
        ]
    ]);

} catch (PDOException $e) {
    error_log("Complete Profile Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem saat memperbarui profil.']);
}
