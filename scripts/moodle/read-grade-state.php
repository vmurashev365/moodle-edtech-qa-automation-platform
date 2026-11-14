<?php

declare(strict_types=1);

define('CLI_SCRIPT', true);

// Read-only backend check: reports the deterministic student's assignment grade and gradebook grade as
// JSON without changing grades or submissions. Interpreting the state is left to the caller, so a
// regrade error or a missing grade item is reported, not treated as a script failure.

require_once(__DIR__ . '/lib/cli-support.php');

const READ_FAILURE_PREFIX = 'Grade state read failed';

function read_fail(string $message): void {
    qa_cli_fail(READ_FAILURE_PREFIX, $message);
}

$cmid = qa_cli_required_int_env(READ_FAILURE_PREFIX, 'MOODLE_ASSIGNMENT_ID');
$studentid = qa_cli_required_int_env(READ_FAILURE_PREFIX, 'MOODLE_STUDENT_ID');

require_once qa_cli_find_config(READ_FAILURE_PREFIX);

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

    // assign::get_user_grade() looks up the latest submission with create=true. Requiring the seeded
    // submission up front keeps that lookup from inserting an empty one.
    $assignment = new assign(context_module::instance($cm->id), $cm, $course);
    if (!$assignment->get_user_submission($studentid, false)) {
        read_fail("student {$studentid} has no submission for assignment cmid {$cmid}. Run npm run moodle:seed:ready.");
    }

    // grade_get_grades() finishes a pending gradebook regrade first, as opening the gradebook page does.
    $state = qa_read_grade_state($course, $cm, $student);
} catch (Throwable $error) {
    read_fail($error->getMessage());
}

echo json_encode(
    [
        'ok' => true,
        'cmid' => $cmid,
        'assignmentInstanceId' => (int) $cm->instance,
        'studentId' => $studentid,
        'assignGrade' => $state['assignGrade'],
        'gradebookState' => $state['gradebookState'],
        'gradebookGrade' => $state['gradebookGrade'],
        'regradeErrors' => $state['regradeErrors'],
    ],
    JSON_UNESCAPED_SLASHES
) . PHP_EOL;
