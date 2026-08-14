<?php
require_once '../config/cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

// Since we use stateless JWT, logout is handled by the frontend dropping the token.
// If using refresh tokens or blacklists, handle it here.
echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
