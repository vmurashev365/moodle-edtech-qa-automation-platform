<?php

declare(strict_types=1);

define('CLI_SCRIPT', true);

// Read-only: reports the installed Moodle release and version as JSON, for the evidence environment
// facts. Values come from the running site's configuration, not from docker-compose.yml.

require_once(__DIR__ . '/lib/cli-support.php');

const RELEASE_FAILURE_PREFIX = 'Moodle release read failed';

require_once qa_cli_find_config(RELEASE_FAILURE_PREFIX);

global $CFG;

if (empty($CFG->release) || empty($CFG->version)) {
    qa_cli_fail(RELEASE_FAILURE_PREFIX, 'The site configuration has no release or version; is Moodle installed?');
}

echo json_encode([
    'release' => (string) $CFG->release,
    'version' => (string) $CFG->version,
    'branch' => isset($CFG->branch) ? (string) $CFG->branch : null,
], JSON_UNESCAPED_SLASHES) . PHP_EOL;
