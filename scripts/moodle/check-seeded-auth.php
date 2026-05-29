<?php

declare(strict_types=1);

define('CLI_SCRIPT', true);

function auth_fail(string $message): void {
    fwrite(STDERR, "Seeded Moodle auth check failed: {$message}" . PHP_EOL);
    exit(1);
}

function auth_env(string $name, string $default = ''): string {
    $value = getenv($name);

    if ($value === false || trim((string) $value) === '') {
        return $default;
    }

    return trim((string) $value);
}

function auth_find_config(): string {
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

    auth_fail('Could not find Moodle config.php in the known container paths.');
}

$username = auth_env('MOODLE_AUTH_USERNAME');
$password = auth_env('MOODLE_AUTH_PASSWORD');
$label = auth_env('MOODLE_AUTH_LABEL', 'seeded');

if ($username === '') {
    auth_fail('MOODLE_AUTH_USERNAME is required.');
}

if ($password === '') {
    auth_fail("MOODLE_AUTH_PASSWORD is required for {$label} user {$username}.");
}

require_once auth_find_config();
require_once($CFG->dirroot . '/lib/moodlelib.php');

global $CFG;

$CFG->noemailever = true;

$user = authenticate_user_login($username, $password);

if (!$user) {
    auth_fail("Moodle rejected {$label} user {$username}.");
}

echo json_encode(
    [
        'ok' => true,
        'label' => $label,
        'id' => (int) $user->id,
        'username' => $user->username,
        'auth' => $user->auth,
    ],
    JSON_UNESCAPED_SLASHES
) . PHP_EOL;
