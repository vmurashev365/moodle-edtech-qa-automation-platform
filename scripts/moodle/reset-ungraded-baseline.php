<?php

declare(strict_types=1);

define('CLI_SCRIPT', true);

// Lightweight per-scenario reset: puts the deterministic student's assignment grade back to
// "not graded" without re-running the full controlled seed.

function reset_fail(string $message): void {
    fwrite(STDERR, "Ungraded baseline reset failed: {$message}" . PHP_EOL);
    exit(1);
}

function reset_required_int_env(string $name): int {
    $value = trim((string) getenv($name));

    if (!preg_match('/^[1-9][0-9]*$/', $value)) {
        reset_fail("{$name} must be a positive integer; received \"{$value}\". Run npm run moodle:seed:ready.");
    }

    return (int) $value;
}

function reset_find_config(): string {
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

    reset_fail('Could not find Moodle config.php in the known container paths.');
}

$cmid = reset_required_int_env('MOODLE_ASSIGNMENT_ID');
$studentid = reset_required_int_env('MOODLE_STUDENT_ID');

require_once reset_find_config();

global $CFG, $USER;

$CFG->noemailever = true;

require_once($CFG->libdir . '/gradelib.php');
require_once($CFG->dirroot . '/mod/assign/locallib.php');
require_once(__DIR__ . '/lib/grade-baseline.php');

try {
    $admin = get_admin();
    \core\session\manager::set_user($admin);
    $USER = $admin;

    $cm = get_coursemodule_from_id('assign', $cmid, 0, false, MUST_EXIST);
    $course = get_course((int) $cm->course);
    $student = core_user::get_user($studentid, '*', MUST_EXIST);

    qa_reset_grade_to_ungraded($course, $cm, $student);
    $state = qa_read_grade_state($course, $cm, $student);
} catch (Throwable $error) {
    reset_fail($error->getMessage());
}

if (!$state['ungraded']) {
    reset_fail(
        'grade is still set after reset: ' . json_encode($state, JSON_UNESCAPED_SLASHES)
    );
}

echo json_encode(
    [
        'ok' => true,
        'cmid' => $cmid,
        'studentId' => $studentid,
        'assignGrade' => $state['assignGrade'],
        'gradebookGrade' => $state['gradebookGrade'],
        'status' => 'notgraded',
    ],
    JSON_UNESCAPED_SLASHES
) . PHP_EOL;
