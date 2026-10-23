<?php

declare(strict_types=1);

// Shared by the per-scenario CLI scripts (reset-ungraded-baseline.php, read-grade-state.php). Plain PHP:
// callers require it before Moodle config.php, because qa_cli_find_config() locates that file.

function qa_cli_fail(string $prefix, string $message): void {
    fwrite(STDERR, "{$prefix}: {$message}" . PHP_EOL);
    exit(1);
}

function qa_cli_required_int_env(string $prefix, string $name): int {
    $value = trim((string) getenv($name));

    if (!preg_match('/^[1-9][0-9]*$/', $value)) {
        qa_cli_fail($prefix, "{$name} must be a positive integer; received \"{$value}\". Run npm run moodle:seed:ready.");
    }

    return (int) $value;
}

function qa_cli_find_config(string $prefix): string {
    $candidates = [
        '/opt/bitnami/moodle/config.php',
        '/bitnami/moodle/config.php',
        '/var/www/html/config.php',
        getcwd() . '/config.php',
    ];

    foreach ($candidates as $candidate) {
        if (is_readable($candidate)) {
            return $candidate;
        }
    }

    qa_cli_fail($prefix, 'Could not find Moodle config.php in the known container paths.');
}
