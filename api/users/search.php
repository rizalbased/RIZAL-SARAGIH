<?php
// api/users/search.php
// Dedicated Search endpoint for users (Search Modal & School Member Directory)
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$query = trim($_GET['q'] ?? $_GET['search'] ?? $_GET['keyword'] ?? '');
$type = trim($_GET['type'] ?? $_GET['userType'] ?? '');
$limit = min(max((int)($_GET['limit'] ?? 50), 1), 100);

try {
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
               email_verified as isVerified,
               email_verified as emailVerified,
               followers_count as followersCount,
               following_count as followingCount,
               posts_count as postsCount,
               created_at as createdAt
        FROM users
        WHERE status != 'Suspended'
    ";

    $params = [];

    if (!empty($query)) {
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
        $term = '%' . $query . '%';
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

    $sql .= " ORDER BY (role = 'ADMIN' OR role = 'SUPER_ADMIN') DESC, created_at DESC LIMIT " . $limit;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'users' => $users,
        'count' => count($users)
    ]);
} catch (PDOException $e) {
    error_log("Search Users Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan saat mencari data pengguna.']);
}
