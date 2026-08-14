<?php
// api/config/mail.php
// SMTP Mailer Engine & Professional HTML Templates for MKVERSE (Gmail SMTP / cPanel)
require_once __DIR__ . '/env.php';

function get_mail_config(): array {
    $rawPass = get_env('SMTP_PASSWORD', '');
    // Sanitize Google App Password (remove accidental spaces)
    $cleanPass = str_replace(' ', '', trim($rawPass));

    $fromEmail = get_env('MAIL_FROM_ADDRESS', get_env('SMTP_USERNAME', 'rizalstudios.backup01@gmail.com'));
    $smtpUser = get_env('SMTP_USERNAME', $fromEmail);

    return [
        'host' => get_env('SMTP_HOST', 'smtp.gmail.com'),
        'port' => (int)get_env('SMTP_PORT', 465),
        'user' => $smtpUser,
        'pass' => $cleanPass,
        'encryption' => strtolower(get_env('SMTP_ENCRYPTION', 'ssl')), // 'ssl' or 'tls'
        'from_email' => $fromEmail,
        'from_name' => get_env('MAIL_FROM_NAME', 'MKVERSE'),
        'app_url' => rtrim(get_env('APP_URL', 'https://app.mkverse.my.id'), '/'),
    ];
}

/**
 * Sends an email using pure PHP SMTP sockets with TLS/SSL, authentication, and detailed diagnostics.
 * 
 * @param string $toEmail Recipient email address
 * @param string $toName Recipient display name
 * @param string $subject Email subject
 * @param string $htmlContent Complete HTML email content
 * @return array ['success' => bool, 'message' => string, 'error' => ?string]
 */
function send_smtp_mail(string $toEmail, string $toName, string $subject, string $htmlContent): array {
    $config = get_mail_config();

    $toEmail = trim($toEmail);
    if (empty($toEmail) || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        return [
            'success' => false,
            'message' => 'Alamat email penerima tidak valid.',
            'error' => 'Invalid recipient email: ' . $toEmail
        ];
    }

    if (empty($config['user']) || empty($config['pass'])) {
        error_log("[MKVERSE SMTP ERROR] SMTP_USERNAME or SMTP_PASSWORD environment variable is not configured.");
        return [
            'success' => false,
            'message' => 'Konfigurasi SMTP belum lengkap di server backend.',
            'error' => 'SMTP credentials missing (SMTP_USERNAME or SMTP_PASSWORD is empty).'
        ];
    }

    $host = $config['host'];
    $port = $config['port'];
    $timeout = 15; // seconds

    $isSSL = ($config['encryption'] === 'ssl' || $port === 465);
    $socketHost = $isSSL ? 'ssl://' . $host : $host;

    error_log("[MKVERSE SMTP] Connecting to {$socketHost}:{$port} for recipient <{$toEmail}>...");

    $socket = @fsockopen($socketHost, $port, $errno, $errstr, $timeout);

    if (!$socket) {
        $errorMsg = "Gagal terhubung ke mail server SMTP ($errstr, code $errno)";
        error_log("[MKVERSE SMTP ERROR] Connection failed: " . $errorMsg);
        return [
            'success' => false,
            'message' => 'Gagal terhubung ke mail server SMTP.',
            'error' => $errorMsg
        ];
    }

    stream_set_timeout($socket, $timeout);

    $readResponse = function() use ($socket): string {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            // In RFC 5321: the 4th character is a space ' ' on the last line of a multi-line reply
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return trim($response);
    };

    $sendCommand = function(string $cmd) use ($socket): void {
        fputs($socket, $cmd . "\r\n");
    };

    // 1. Read initial banner (220)
    $banner = $readResponse();
    if (substr($banner, 0, 3) !== '220') {
        fclose($socket);
        error_log("[MKVERSE SMTP ERROR] Invalid banner response: " . $banner);
        return [
            'success' => false,
            'message' => 'Respon mail server tidak valid saat inisialisasi.',
            'error' => 'SMTP Banner Error: ' . $banner
        ];
    }

    // 2. Send EHLO
    $clientDomain = !empty($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'mkverse.my.id';
    $sendCommand("EHLO " . $clientDomain);
    $ehloResp = $readResponse();

    // 3. Handle STARTTLS if configured for port 587
    if ($config['encryption'] === 'tls' && !$isSSL) {
        $sendCommand("STARTTLS");
        $tlsResp = $readResponse();
        if (substr($tlsResp, 0, 3) !== '220') {
            fclose($socket);
            error_log("[MKVERSE SMTP ERROR] STARTTLS failed: " . $tlsResp);
            return [
                'success' => false,
                'message' => 'Gagal mengaktifkan enkripsi TLS pada koneksi SMTP.',
                'error' => 'STARTTLS error: ' . $tlsResp
            ];
        }

        $cryptoMethod = STREAM_CRYPTO_METHOD_TLS_CLIENT;
        if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) {
            $cryptoMethod |= STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
        }
        if (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT')) {
            $cryptoMethod |= STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;
        }

        if (!stream_socket_enable_crypto($socket, true, $cryptoMethod)) {
            fclose($socket);
            error_log("[MKVERSE SMTP ERROR] TLS handshake failed.");
            return [
                'success' => false,
                'message' => 'Handshake enkripsi TLS gagal.',
                'error' => 'TLS crypto handshake failed'
            ];
        }

        $sendCommand("EHLO " . $clientDomain);
        $readResponse();
    }

    // 4. AUTH LOGIN
    $sendCommand("AUTH LOGIN");
    $authInit = $readResponse();
    if (substr($authInit, 0, 3) !== '334') {
        fclose($socket);
        error_log("[MKVERSE SMTP ERROR] AUTH LOGIN rejected: " . $authInit);
        return [
            'success' => false,
            'message' => 'Metode autentikasi SMTP tidak didukung oleh mail server.',
            'error' => 'AUTH LOGIN rejected: ' . $authInit
        ];
    }

    // Send Base64 Username
    $sendCommand(base64_encode($config['user']));
    $authUserResp = $readResponse();
    if (substr($authUserResp, 0, 3) !== '334') {
        fclose($socket);
        error_log("[MKVERSE SMTP ERROR] SMTP Username rejected: " . $authUserResp);
        return [
            'success' => false,
            'message' => 'Username SMTP ditolak oleh server.',
            'error' => 'SMTP Username rejected: ' . $authUserResp
        ];
    }

    // Send Base64 Password
    $sendCommand(base64_encode($config['pass']));
    $authPassResp = $readResponse();
    if (substr($authPassResp, 0, 3) !== '235') {
        fclose($socket);
        error_log("[MKVERSE SMTP ERROR] SMTP Authentication failed: " . $authPassResp);
        return [
            'success' => false,
            'message' => 'Autentikasi SMTP gagal. Pastikan Anda menggunakan Google App Password yang valid (bukan password login biasa).',
            'error' => 'SMTP Auth failed: ' . $authPassResp
        ];
    }

    // 5. MAIL FROM
    $sendCommand("MAIL FROM: <" . $config['from_email'] . ">");
    $mailFromResp = $readResponse();
    if (substr($mailFromResp, 0, 3) !== '250') {
        fclose($socket);
        error_log("[MKVERSE SMTP ERROR] MAIL FROM rejected: " . $mailFromResp);
        return [
            'success' => false,
            'message' => 'Alamat pengirim email ditolak oleh server SMTP.',
            'error' => 'MAIL FROM rejected: ' . $mailFromResp
        ];
    }

    // 6. RCPT TO
    $sendCommand("RCPT TO: <" . $toEmail . ">");
    $rcptResp = $readResponse();
    if (substr($rcptResp, 0, 3) !== '250' && substr($rcptResp, 0, 3) !== '251') {
        fclose($socket);
        error_log("[MKVERSE SMTP ERROR] RCPT TO rejected for <{$toEmail}>: " . $rcptResp);
        return [
            'success' => false,
            'message' => 'Alamat email penerima ditolak oleh mail server.',
            'error' => 'RCPT TO rejected: ' . $rcptResp
        ];
    }

    // 7. DATA
    $sendCommand("DATA");
    $dataResp = $readResponse();
    if (substr($dataResp, 0, 3) !== '354') {
        fclose($socket);
        error_log("[MKVERSE SMTP ERROR] DATA command rejected: " . $dataResp);
        return [
            'success' => false,
            'message' => 'Gagal mengirimkan konten data email ke server SMTP.',
            'error' => 'DATA command rejected: ' . $dataResp
        ];
    }

    // Prepare MIME Headers
    $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
    $encodedFromName = "=?UTF-8?B?" . base64_encode($config['from_name']) . "?=";
    $encodedToName = !empty($toName) ? "=?UTF-8?B?" . base64_encode($toName) . "?=" : $toEmail;

    $headers = [];
    $headers[] = "From: {$encodedFromName} <{$config['from_email']}>";
    $headers[] = "To: {$encodedToName} <{$toEmail}>";
    $headers[] = "Reply-To: <{$config['from_email']}>";
    $headers[] = "Subject: {$encodedSubject}";
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-Type: text/html; charset=UTF-8";
    $headers[] = "Content-Transfer-Encoding: 8bit";
    $headers[] = "Date: " . date('r');
    $headers[] = "Message-ID: <" . time() . "." . bin2hex(random_bytes(8)) . "@" . $clientDomain . ">";
    $headers[] = "X-Mailer: MKVERSE Engine v2.0";

    $messagePayload = implode("\r\n", $headers) . "\r\n\r\n" . $htmlContent . "\r\n.";
    fputs($socket, $messagePayload . "\r\n");

    $sendResult = $readResponse();
    if (substr($sendResult, 0, 3) !== '250') {
        fclose($socket);
        error_log("[MKVERSE SMTP ERROR] Message delivery failed: " . $sendResult);
        return [
            'success' => false,
            'message' => 'Server menolak pengiriman isi email.',
            'error' => 'Delivery response error: ' . $sendResult
        ];
    }

    // 8. QUIT
    $sendCommand("QUIT");
    $readResponse();
    fclose($socket);

    error_log("[MKVERSE SMTP SUCCESS] Verification/Notification email successfully delivered to <{$toEmail}> (Status: {$sendResult})");

    return [
        'success' => true,
        'message' => 'Email berhasil dikirim ke ' . $toEmail,
        'error' => null
    ];
}

/**
 * HTML Email Template for Email Verification
 */
function get_verification_email_html(string $name, string $verificationUrl): string {
    $escapedName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $escapedUrl = htmlspecialchars($verificationUrl, ENT_QUOTES, 'UTF-8');

    return <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Email Akun MKVERSE</title>
</head>
<body style="margin:0; padding:0; background-color:#F5F5F0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0B0B0B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F5F5F0; padding:40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width:540px; background-color:#FFFFFF; border:3px solid #0B0B0B; border-radius:24px; box-shadow:6px 6px 0px 0px #0B0B0B; overflow:hidden;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color:#0B0B0B; padding:30px 24px; text-align:center;">
              <table role="presentation" align="center" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#B8FF00; color:#0B0B0B; font-weight:900; font-size:22px; padding:10px 22px; border-radius:14px; border:2px solid #0B0B0B; display:inline-block; letter-spacing:0.5px;">
                    ⚡ MKVERSE
                  </td>
                </tr>
              </table>
              <h1 style="color:#FFFFFF; font-size:22px; font-weight:900; margin:18px 0 4px 0; letter-spacing:-0.5px;">
                Verifikasi Alamat Email Anda
              </h1>
              <p style="color:#A1A1AA; font-size:13px; margin:0; font-weight:600;">
                Komunitas Digital SMK Multi Karya Medan
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 28px; background-color:#FFFFFF;">
              <p style="font-size:16px; font-weight:700; color:#0B0B0B; margin:0 0 12px 0;">
                Halo, {$escapedName}! 👋
              </p>
              <p style="font-size:14px; color:#4B5563; line-height:1.6; margin:0 0 24px 0;">
                Selamat datang di <strong>MKVERSE</strong>! Tinggal satu langkah lagi untuk mengaktifkan akun Anda. Silakan klik tombol di bawah ini untuk memverifikasi bahwa ini adalah alamat email aktif Anda:
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="{$escapedUrl}" target="_blank" style="display:inline-block; background-color:#B8FF00; color:#0B0B0B; font-size:15px; font-weight:900; text-decoration:none; padding:15px 36px; border-radius:16px; border:2.5px solid #0B0B0B; box-shadow:4px 4px 0px 0px #0B0B0B; text-align:center;">
                      ✓ Verifikasi Email Sekarang
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color:#F4F4F5; border:2px dashed #0B0B0B; border-radius:14px; padding:16px 18px; margin:24px 0 16px 0;">
                <p style="font-size:12px; color:#3F3F46; margin:0 0 8px 0; font-weight:700;">
                  ⏳ Masa Berlaku: 24 Jam
                </p>
                <p style="font-size:12px; color:#52525B; margin:0 0 8px 0; line-height:1.5;">
                  Jika tombol di atas tidak dapat diklik, salin dan buka tautan berikut di browser Anda:
                </p>
                <p style="font-size:11px; word-break:break-all; color:#2563EB; margin:0; font-weight:600;">
                  <a href="{$escapedUrl}" style="color:#2563EB; text-decoration:underline;">{$escapedUrl}</a>
                </p>
              </div>

              <p style="font-size:12px; color:#71717A; margin:20px 0 0 0; line-height:1.5;">
                Jika Anda tidak merasa mendaftar di MKVERSE, abaikan email ini dengan aman. Akun tidak akan aktif tanpa verifikasi email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F5F5F0; border-top:2px solid #0B0B0B; padding:20px 24px; text-align:center;">
              <p style="font-size:12px; font-weight:800; color:#0B0B0B; margin:0 0 4px 0;">
                © 2025 MKVERSE — SMK Multi Karya Medan
              </p>
              <p style="font-size:11px; color:#71717A; margin:0;">
                JL. STM No. 10, Medan, Sumatera Utara
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * HTML Email Template for Password Reset
 */
function get_reset_password_email_html(string $name, string $resetUrl): string {
    $escapedName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $escapedUrl = htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8');

    return <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password MKVERSE</title>
</head>
<body style="margin:0; padding:0; background-color:#F5F5F0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0B0B0B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F5F5F0; padding:40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width:540px; background-color:#FFFFFF; border:3px solid #0B0B0B; border-radius:24px; box-shadow:6px 6px 0px 0px #0B0B0B; overflow:hidden;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color:#0B0B0B; padding:30px 24px; text-align:center;">
              <table role="presentation" align="center" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#FFE600; color:#0B0B0B; font-weight:900; font-size:22px; padding:10px 22px; border-radius:14px; border:2px solid #0B0B0B; display:inline-block; letter-spacing:0.5px;">
                    🔑 MKVERSE
                  </td>
                </tr>
              </table>
              <h1 style="color:#FFFFFF; font-size:22px; font-weight:900; margin:18px 0 4px 0; letter-spacing:-0.5px;">
                Permintaan Reset Kata Sandi
              </h1>
              <p style="color:#A1A1AA; font-size:13px; margin:0; font-weight:600;">
                Atur Ulang Kata Sandi Akun Anda
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 28px; background-color:#FFFFFF;">
              <p style="font-size:16px; font-weight:700; color:#0B0B0B; margin:0 0 12px 0;">
                Halo, {$escapedName}! 🔒
              </p>
              <p style="font-size:14px; color:#4B5563; line-height:1.6; margin:0 0 24px 0;">
                Kami menerima permintaan untuk mereset kata sandi akun MKVERSE Anda. Klik tombol di bawah ini untuk membuat kata sandi baru:
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="{$escapedUrl}" target="_blank" style="display:inline-block; background-color:#FFE600; color:#0B0B0B; font-size:15px; font-weight:900; text-decoration:none; padding:15px 36px; border-radius:16px; border:2.5px solid #0B0B0B; box-shadow:4px 4px 0px 0px #0B0B0B; text-align:center;">
                      🔑 Buat Kata Sandi Baru
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color:#FFFBEB; border:2px dashed #D97706; border-radius:14px; padding:16px 18px; margin:24px 0 16px 0;">
                <p style="font-size:12px; color:#92400E; margin:0 0 8px 0; font-weight:700;">
                  ⏱️ Masa Berlaku: 60 Menit
                </p>
                <p style="font-size:12px; color:#92400E; margin:0 0 8px 0; line-height:1.5;">
                  Tautan ini hanya dapat digunakan satu kali. Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut:
                </p>
                <p style="font-size:11px; word-break:break-all; color:#2563EB; margin:0; font-weight:600;">
                  <a href="{$escapedUrl}" style="color:#2563EB; text-decoration:underline;">{$escapedUrl}</a>
                </p>
              </div>

              <p style="font-size:12px; color:#71717A; margin:20px 0 0 0; line-height:1.5;">
                Jika Anda tidak meminta reset kata sandi, abaikan email ini dan akun Anda tetap aman.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F5F5F0; border-top:2px solid #0B0B0B; padding:20px 24px; text-align:center;">
              <p style="font-size:12px; font-weight:800; color:#0B0B0B; margin:0 0 4px 0;">
                © 2025 MKVERSE — SMK Multi Karya Medan
              </p>
              <p style="font-size:11px; color:#71717A; margin:0;">
                JL. STM No. 10, Medan, Sumatera Utara
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}
