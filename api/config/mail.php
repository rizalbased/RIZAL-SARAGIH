<?php
// api/config/mail.php
// SMTP Mailer & Email Templates for MKVERSE using Gmail SMTP

function get_mail_config() {
    return [
        'host' => getenv('SMTP_HOST') ?: 'smtp.gmail.com',
        'port' => (int)(getenv('SMTP_PORT') ?: 465),
        'user' => getenv('SMTP_USERNAME') ?: 'rizalstudios.backup01@gmail.com',
        'pass' => getenv('SMTP_PASSWORD') ?: '',
        'encryption' => getenv('SMTP_ENCRYPTION') ?: 'ssl', // ssl or tls
        'from_email' => getenv('MAIL_FROM_ADDRESS') ?: 'rizalstudios.backup01@gmail.com',
        'from_name' => getenv('MAIL_FROM_NAME') ?: 'MKVERSE',
        'app_url' => rtrim(getenv('APP_URL') ?: 'https://app.mkverse.my.id', '/'),
    ];
}

/**
 * Sends an email using pure PHP SMTP sockets with TLS/SSL support.
 */
function send_smtp_mail(string $toEmail, string $toName, string $subject, string $htmlContent): bool {
    $config = get_mail_config();
    
    // If SMTP password is not set, log and attempt standard mail() fallback
    if (empty($config['user']) || empty($config['pass'])) {
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: " . "=?UTF-8?B?" . base64_encode($config['from_name']) . "?=" . " <" . $config['from_email'] . ">\r\n";
        $headers .= "Reply-To: " . $config['from_email'] . "\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();
        
        @mail($toEmail, $subject, $htmlContent, $headers);
        return true;
    }

    $host = $config['host'];
    $port = $config['port'];
    $timeout = 10;
    
    $socketHost = ($config['encryption'] === 'ssl' || $port === 465) ? 'ssl://' . $host : $host;
    $socket = @fsockopen($socketHost, $port, $errno, $errstr, $timeout);

    if (!$socket) {
        error_log("SMTP connection failed: $errstr ($errno)");
        return false;
    }

    $read = function() use ($socket) {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
        return $response;
    };

    $write = function($cmd) use ($socket) {
        fputs($socket, $cmd . "\r\n");
    };

    $read();
    $write("EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
    $read();

    if ($config['encryption'] === 'tls' && $port !== 465) {
        $write("STARTTLS");
        $tlsResponse = $read();
        if (substr($tlsResponse, 0, 3) !== '220') {
            fclose($socket);
            return false;
        }
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        $write("EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
        $read();
    }

    $write("AUTH LOGIN");
    $read();
    $write(base64_encode($config['user']));
    $read();
    $write(base64_encode($config['pass']));
    $authResp = $read();

    if (substr($authResp, 0, 3) !== '235') {
        error_log("SMTP Auth failed: " . $authResp);
        fclose($socket);
        return false;
    }

    $write("MAIL FROM: <" . $config['from_email'] . ">");
    $read();
    $write("RCPT TO: <" . $toEmail . ">");
    $read();
    $write("DATA");
    $read();

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . "=?UTF-8?B?" . base64_encode($config['from_name']) . "?=" . " <" . $config['from_email'] . ">\r\n";
    $headers .= "To: " . "=?UTF-8?B?" . base64_encode($toName) . "?=" . " <" . $toEmail . ">\r\n";
    $headers .= "Subject: " . "=?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $headers .= "Date: " . date('r') . "\r\n";

    $message = $headers . "\r\n" . $htmlContent . "\r\n.\r\n";
    fputs($socket, $message);
    $read();

    $write("QUIT");
    $read();
    fclose($socket);

    return true;
}

/**
 * HTML Email Template for Email Verification
 */
function get_verification_email_html(string $name, string $verificationUrl): string {
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
            <td style="background-color:#0B0B0B; padding:28px 24px; text-align:center;">
              <table role="presentation" align="center" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#B8FF00; color:#0B0B0B; font-weight:900; font-size:20px; padding:10px 18px; border-radius:14px; border:2px solid #0B0B0B; display:inline-block;">
                    MKVERSE
                  </td>
                </tr>
              </table>
              <h1 style="color:#FFFFFF; font-size:22px; font-weight:900; margin:16px 0 4px 0; letter-spacing:-0.5px;">
                Verifikasi Email Akun Anda
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
                Halo, {$name}! 👋
              </p>
              <p style="font-size:14px; color:#4B5563; line-height:1.6; margin:0 0 24px 0;">
                Terima kasih telah mendaftar di <strong>MKVERSE</strong>! Untuk mengaktifkan akun Anda dan menikmati seluruh fitur interaksi, radio sekolah, serta berbagi karya, silakan verifikasi alamat email Anda dengan menekan tombol di bawah ini:
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="{$verificationUrl}" target="_blank" style="display:inline-block; background-color:#B8FF00; color:#0B0B0B; font-size:15px; font-weight:900; text-decoration:none; padding:14px 32px; border-radius:16px; border:2px solid #0B0B0B; box-shadow:4px 4px 0px 0px #0B0B0B; text-align:center; transition:all 0.2s;">
                      ✓ Verifikasi Email Sekarang
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color:#F4F4F5; border:2px dashed #0B0B0B; border-radius:14px; padding:14px 18px; margin:24px 0 16px 0;">
                <p style="font-size:12px; color:#52525B; margin:0; line-height:1.5;">
                  ⏳ <strong>Masa Berlaku:</strong> Link verifikasi ini berlaku selama <strong>24 jam</strong>. Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut di browser Anda:
                </p>
                <p style="font-size:11px; word-break:break-all; color:#2563EB; margin:8px 0 0 0;">
                  <a href="{$verificationUrl}" style="color:#2563EB;">{$verificationUrl}</a>
                </p>
              </div>

              <p style="font-size:12px; color:#71717A; margin:20px 0 0 0; line-height:1.5;">
                Jika Anda tidak merasa mendaftar di MKVERSE, Anda dapat mengabaikan email ini dengan aman.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F5F5F0; border-top:2px solid #0B0B0B; padding:18px 24px; text-align:center;">
              <p style="font-size:12px; font-weight:700; color:#0B0B0B; margin:0 0 4px 0;">
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
            <td style="background-color:#0B0B0B; padding:28px 24px; text-align:center;">
              <table role="presentation" align="center" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#FFDD00; color:#0B0B0B; font-weight:900; font-size:20px; padding:10px 18px; border-radius:14px; border:2px solid #0B0B0B; display:inline-block;">
                    MKVERSE
                  </td>
                </tr>
              </table>
              <h1 style="color:#FFFFFF; font-size:22px; font-weight:900; margin:16px 0 4px 0; letter-spacing:-0.5px;">
                Permintaan Reset Password
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
                Halo, {$name}! 🔒
              </p>
              <p style="font-size:14px; color:#4B5563; line-height:1.6; margin:0 0 24px 0;">
                Kami menerima permintaan untuk mereset kata sandi akun MKVERSE Anda. Klik tombol di bawah ini untuk membuat password baru:
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="{$resetUrl}" target="_blank" style="display:inline-block; background-color:#FFDD00; color:#0B0B0B; font-size:15px; font-weight:900; text-decoration:none; padding:14px 32px; border-radius:16px; border:2px solid #0B0B0B; box-shadow:4px 4px 0px 0px #0B0B0B; text-align:center; transition:all 0.2s;">
                      🔑 Buat Password Baru
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color:#FFFBEB; border:2px dashed #D97706; border-radius:14px; padding:14px 18px; margin:24px 0 16px 0;">
                <p style="font-size:12px; color:#92400E; margin:0; line-height:1.5;">
                  ⏱️ <strong>Keamanan:</strong> Link reset password ini hanya berlaku selama <strong>60 menit</strong>. Jika Anda tidak meminta reset password, abaikan email ini dan akun Anda tetap aman.
                </p>
                <p style="font-size:11px; word-break:break-all; color:#2563EB; margin:8px 0 0 0;">
                  <a href="{$resetUrl}" style="color:#2563EB;">{$resetUrl}</a>
                </p>
              </div>

              <p style="font-size:12px; color:#71717A; margin:20px 0 0 0; line-height:1.5;">
                Jangan bagikan link ini kepada siapa pun, termasuk staf sekolah.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F5F5F0; border-top:2px solid #0B0B0B; padding:18px 24px; text-align:center;">
              <p style="font-size:12px; font-weight:700; color:#0B0B0B; margin:0 0 4px 0;">
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
