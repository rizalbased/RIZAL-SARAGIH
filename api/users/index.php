<?php
// api/users/index.php
// Returns list of users from MySQL database
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $search = trim($_GET['search'] ?? $_GET['q'] ?? '');
        $type = trim($_GET['type'] ?? $_GET['userType'] ?? '');

        $sql = "
            SELECT id, 
                   COALESCE(full_name, display_name, username) as name,
                   COALESCE(full_name, display_name, username) as full_name,
                   username, 
                   email, 
                   COALESCE(profile_photo, avatar, CONCAT('https://api.dicebear.com/7.x/bottts/svg?seed=', username)) as avatar,
                   COALESCE(profile_photo, avatar, CONCAT('https://api.dicebear.com/7.x/bottts/svg?seed=', username)) as profile_photo,
                   cover_image as coverImage, 
                   bio, 
                   COALESCE(membership_status, user_type, 'Siswa') as userType,
                   COALESCE(membership_status, user_type, 'Siswa') as membership_status,
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
            WHERE status != 'Suspended'
        ";

        $params = [];

        if (!empty($search)) {
            $sql .= " AND (
                full_name LIKE ? OR 
                display_name LIKE ? OR 
                username LIKE ? OR 
                email LIKE ? OR 
                class_name LIKE ? OR 
                kelas LIKE ? OR 
                major LIKE ? OR 
                jurusan LIKE ?
            )";
            $term = '%' . $search . '%';
            $params = array_merge($params, [$term, $term, $term, $term, $term, $term, $term, $term]);
        }

        if (!empty($type) && $type !== 'all') {
            if ($type === 'Siswa') {
                $sql .= " AND (membership_status = 'Siswa' OR user_type = 'Siswa')";
            } elseif ($type === 'Guru') {
                $sql .= " AND (membership_status IN ('Guru', 'Guru/Staf') OR user_type IN ('Guru', 'Guru/Staf'))";
            } elseif ($type === 'Karyawan') {
                $sql .= " AND (membership_status IN ('Karyawan', 'Karyawan/Staf', 'Guru/Staf') OR user_type IN ('Karyawan', 'Karyawan/Staf', 'Guru/Staf'))";
            }
        }

        $sql .= " ORDER BY (role = 'ADMIN' OR role = 'SUPER_ADMIN') DESC, created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
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
