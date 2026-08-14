<?php
// api/config/cors.php
// CORS configuration for MKVERSE (Frontend https://app.mkverse.my.id)

$allowed_origins = [
    'https://app.mkverse.my.id',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
];

$http_origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (!empty($http_origin)) {
    if (in_array($http_origin, $allowed_origins) || strpos($http_origin, 'run.app') !== false || strpos($http_origin, 'localhost') !== false) {
        header("Access-Control-Allow-Origin: $http_origin");
    } else {
        header("Access-Control-Allow-Origin: https://app.mkverse.my.id");
    }
} else {
    header("Access-Control-Allow-Origin: https://app.mkverse.my.id");
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token, Origin, Accept');
header('Access-Control-Max-Age: 86400');

// Handle preflight OPTIONS requests immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
