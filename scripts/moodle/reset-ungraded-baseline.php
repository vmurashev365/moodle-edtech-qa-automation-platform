<?php

declare(strict_types=1);

define('CLI_SCRIPT', true);

// Lightweight per-scenario reset: puts the deterministic student's assignment grade back to
// "not graded" without re-running the full controlled seed.

require_once(__DIR__ . '/lib/cli-support.php');

const RESET_FAILURE_PREFIX = 'Ungraded baseline reset failed';

function reset_fail(string $message): void {
    qa_cli_fail(RESET_FAILURE_PREFIX, $message);
}

$cmid = qa_cli_required_int_env(RESET_FAILURE_PREFIX, 'MOODLE_ASSIGNMENT_ID');
$studentid = qa_cli_required_int_env(RESET_FAILURE_PREFIX, 'MOODLE_STUDENT_ID');

require_once qa_cli_find_config(RESET_FAILURE_PREFIX);

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

if ($state['gradebookState'] === 'regrade-error') {
    $details = $state['regradeErrors'] ? implode('; ', $state['regradeErrors']) : 'Moodle reported no details';
    reset_fail("the gradebook regrade failed, so the gradebook grade could not be read: {$details}");
}

if ($state['gradebookState'] === 'missing') {
    reset_fail("no gradebook item exists for assignment cmid {$cmid}. Run npm run moodle:seed:ready.");
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
        'gradebookState' => $state['gradebookState'],
        'gradebookGrade' => $state['gradebookGrade'],
        'status' => 'notgraded',
    ],
    JSON_UNESCAPED_SLASHES
) . PHP_EOL;
