<?php
// api/auth/me.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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

try {
    $stmt = $pdo->prepare("
        SELECT id, username, email, display_name, avatar, cover_image, bio,
               user_type, role, kelas, jurusan, mata_pelajaran, divisi,
               status, email_verified, google_id, auth_provider, has_completed_profile
        FROM users 
        WHERE id = ? 
        LIMIT 1
    ");
    $stmt->execute([$authUser['id']]);
    $user = $stmt->fetch();

    if ($user) {
        if ($user['status'] === 'Suspended') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'isSuspended' => true,
                'message' => 'Akun Anda sedang ditangguhkan.'
            ]);
            exit;
        }

        $needsUsernameSetup = empty($user['has_completed_profile']) || (int)$user['has_completed_profile'] === 0;

        $formattedUser = [
            'id' => $user['id'],
            'username' => $user['username'],
            'name' => $user['display_name'],
            'email' => $user['email'],
            'avatar' => $user['avatar'],
            'coverImage' => $user['cover_image'],
            'bio' => $user['bio'],
            'userType' => $user['user_type'],
            'role' => $user['role'],
            'kelas' => $user['kelas'],
            'jurusan' => $user['jurusan'],
            'mataPelajaran' => $user['mata_pelajaran'],
            'divisi' => $user['divisi'],
            'status' => $user['status'],
            'isVerified' => (bool)$user['email_verified'],
            'emailVerified' => (bool)$user['email_verified'],
            'authProvider' => $user['auth_provider'],
            'hasCompletedUsername' => !$needsUsernameSetup
        ];

        echo json_encode([
            'success' => true,
            'user' => $formattedUser,
            'needsUsernameSetup' => $needsUsernameSetup
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Pengguna tidak ditemukan.']);
    }
} catch (PDOException $e) {
    error_log("Me Endpoint Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem.']);
}
