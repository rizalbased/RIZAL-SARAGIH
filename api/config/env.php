<?php
// api/config/env.php
// Environment variable loader for MKVERSE backend API

function load_env_file(?string $path = null): void {
    if ($path === null) {
        $possiblePaths = [
            __DIR__ . '/../.env',
            __DIR__ . '/../../.env',
            dirname(__DIR__) . '/.env',
            $_SERVER['DOCUMENT_ROOT'] . '/.env',
            $_SERVER['DOCUMENT_ROOT'] . '/api/.env'
        ];
        foreach ($possiblePaths as $p) {
            if (file_exists($p) && is_readable($p)) {
                $path = $p;
                break;
            }
        }
    }

    if (!$path || !file_exists($path) || !is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!$lines) return;

    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;

        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            $value = trim($value, '"\'');

            if (!empty($key)) {
                if (getenv($key) === false) {
                    putenv("$key=$value");
                }
                if (!isset($_ENV[$key])) {
                    $_ENV[$key] = $value;
                }
                if (!isset($_SERVER[$key])) {
                    $_SERVER[$key] = $value;
                }
            }
        }
    }
}

// Auto load on inclusion
load_env_file();

function get_env(string $key, $default = '') {
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
        return $_ENV[$key];
    }
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
        return $_SERVER[$key];
    }
    $val = getenv($key);
    if ($val !== false && $val !== '') {
        return $val;
    }
    return $default;
}
