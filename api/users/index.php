<?php
// api/users/index.php
// Returns list of users from MySQL database
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("
            SELECT id, 
                   COALESCE(full_name, display_name) as name,
                   COALESCE(full_name, display_name) as full_name,
                   username, 
                   email, 
                   COALESCE(profile_photo, avatar) as avatar,
                   COALESCE(profile_photo, avatar) as profile_photo,
                   cover_image as coverImage, 
                   bio, 
                   COALESCE(membership_status, user_type) as userType,
                   COALESCE(membership_status, user_type) as membership_status,
                   role, 
                   COALESCE(class_name, kelas) as kelas,
                   COALESCE(class_name, kelas) as class_name,
                   COALESCE(major, jurusan) as jurusan,
                   COALESCE(major, jurusan) as major,
                   mata_pelajaran as mataPelajaran, 
                   divisi, 
                   status, 
                   email_verified as emailVerified,
                   email_verified,
                   auth_provider as authProvider,
                   followers_count as followersCount, 
                   following_count as followingCount, 
                   posts_count as postsCount,
                   created_at as createdAt
            FROM users
            ORDER BY created_at DESC
        ");
        $users = $stmt->fetchAll();
        echo json_encode(['success' => true, 'users' => $users]);
    } catch (PDOException $e) {
        error_log("Users Index Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Gagal mengambil data pengguna dari database MySQL.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
}
