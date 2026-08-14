<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT id, username, email, display_name as name, avatar, cover_image as coverImage, bio, user_type as userType, role, status, followers_count as followersCount, following_count as followingCount, posts_count as postsCount FROM users");
    $users = $stmt->fetchAll();
    echo json_encode(['success' => true, 'users' => $users]);
}
