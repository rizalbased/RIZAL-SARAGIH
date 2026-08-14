<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT p.id, p.author_id as authorId, u.display_name as authorName, u.username as authorUsername, u.avatar as authorAvatar, u.user_type as authorType, p.type, p.content, p.media_url as mediaUrl, p.media_type as mediaType, p.mood_tag as moodTag, p.is_anonymous as isAnonymous, p.likes_count as likesCount, p.comments_count as commentsCount, p.created_at as createdAt FROM posts p JOIN users u ON p.author_id = u.id ORDER BY p.created_at DESC");
    $posts = $stmt->fetchAll();
    
    // Format isAnonymous correctly
    foreach ($posts as &$post) {
        $post['isAnonymous'] = (bool)$post['isAnonymous'];
        if ($post['isAnonymous']) {
            $post['authorName'] = 'Siswa Multi Karya (Anonim)';
            $post['authorUsername'] = 'anonymous';
            $post['authorAvatar'] = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250';
        }
    }
    
    echo json_encode(['success' => true, 'posts' => $posts]);
}
