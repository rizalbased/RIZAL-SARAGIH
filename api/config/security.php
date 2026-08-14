<?php
// api/config/security.php
// Rate limiting & security utilities

function get_client_ip() {
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return $_SERVER['HTTP_CF_CONNECTING_IP'];
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

function check_rate_limit(PDO $pdo, string $action, string $identifier, int $maxAttempts = 5, int $decaySeconds = 900): bool {
    try {
        $stmt = $pdo->prepare("SELECT attempts, UNIX_TIMESTAMP(last_attempt_at) as last_ts FROM rate_limits WHERE action = ? AND identifier = ?");
        $stmt->execute([$action, $identifier]);
        $row = $stmt->fetch();

        if (!$row) {
            return true; // No attempts recorded yet
        }

        $now = time();
        $elapsed = $now - (int)$row['last_ts'];

        // If elapsed time exceeded decay window, reset attempts
        if ($elapsed > $decaySeconds) {
            $resetStmt = $pdo->prepare("DELETE FROM rate_limits WHERE action = ? AND identifier = ?");
            $resetStmt->execute([$action, $identifier]);
            return true;
        }

        return (int)$row['attempts'] < $maxAttempts;
    } catch (Exception $e) {
        // Fallback: don't lock out on rate limit table error
        return true;
    }
}

function record_rate_limit_attempt(PDO $pdo, string $action, string $identifier, int $decaySeconds = 900): void {
    try {
        $stmt = $pdo->prepare("SELECT attempts, UNIX_TIMESTAMP(last_attempt_at) as last_ts FROM rate_limits WHERE action = ? AND identifier = ?");
        $stmt->execute([$action, $identifier]);
        $row = $stmt->fetch();

        $now = time();

        if ($row) {
            $elapsed = $now - (int)$row['last_ts'];
            if ($elapsed > $decaySeconds) {
                // Reset count
                $update = $pdo->prepare("UPDATE rate_limits SET attempts = 1, last_attempt_at = NOW() WHERE action = ? AND identifier = ?");
                $update->execute([$action, $identifier]);
            } else {
                // Increment count
                $update = $pdo->prepare("UPDATE rate_limits SET attempts = attempts + 1, last_attempt_at = NOW() WHERE action = ? AND identifier = ?");
                $update->execute([$action, $identifier]);
            }
        } else {
            $insert = $pdo->prepare("INSERT INTO rate_limits (action, identifier, attempts, last_attempt_at) VALUES (?, ?, 1, NOW())");
            $insert->execute([$action, $identifier]);
        }
    } catch (Exception $e) {
        // Ignore DB rate limit logging failure
    }
}

function clear_rate_limit(PDO $pdo, string $action, string $identifier): void {
    try {
        $stmt = $pdo->prepare("DELETE FROM rate_limits WHERE action = ? AND identifier = ?");
        $stmt->execute([$action, $identifier]);
    } catch (Exception $e) {
        // Ignore
    }
}
