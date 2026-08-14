<?php
// api/auth/test-email.php
// Diagnostic tool for testing SMTP connectivity and Gmail App Password
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/mail.php';

header('Content-Type: application/json');

$to = trim($_GET['to'] ?? $_POST['to'] ?? '');
if (empty($to) || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'Silakan sertakan parameter ?to=email_anda@gmail.com untuk menguji pengiriman email.',
        'smtp_config' => [
            'host' => get_env('SMTP_HOST', 'smtp.gmail.com'),
            'port' => (int)get_env('SMTP_PORT', 465),
            'encryption' => get_env('SMTP_ENCRYPTION', 'ssl'),
            'user' => get_env('SMTP_USERNAME', 'NOT_SET'),
            'pass_configured' => !empty(get_env('SMTP_PASSWORD', '')),
            'from_address' => get_env('MAIL_FROM_ADDRESS', 'NOT_SET'),
            'from_name' => get_env('MAIL_FROM_NAME', 'MKVERSE')
        ]
    ]);
    exit;
}

$testHtml = "
<div style='font-family:sans-serif; padding:20px; border:2px solid #000; border-radius:12px; background:#fff;'>
  <h2 style='color:#000;'>⚡ Tes Pengiriman Email MKVERSE</h2>
  <p>Email ini dikirimkan untuk memastikan koneksi SMTP Gmail di server cPanel backend berhasil berfungsi dengan baik.</p>
  <p><strong>Waktu Server:</strong> " . date('Y-m-d H:i:s T') . "</p>
  <p><strong>Penerima:</strong> " . htmlspecialchars($to) . "</p>
  <hr style='border:1px dashed #ccc;'/>
  <p style='color:#666; font-size:12px;'>SMK Multi Karya Medan — MKVERSE API Engine</p>
</div>
";

$result = send_smtp_mail($to, "Tester MKVERSE", "Tes Koneksi SMTP MKVERSE (" . date('H:i:s') . ")", $testHtml);

echo json_encode([
    'success' => $result['success'],
    'message' => $result['message'],
    'error' => $result['error'],
    'recipient' => $to,
    'timestamp' => date('c')
]);
