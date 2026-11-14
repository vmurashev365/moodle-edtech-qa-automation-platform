<?php

declare(strict_types=1);

// Shared by seed-controlled-data.php, reset-ungraded-baseline.php and read-grade-state.php. Callers must load Moodle
// config.php, mod/assign/locallib.php and lib/gradelib.php, and act as an admin user.

function qa_reset_grade_to_ungraded(stdClass $course, stdClass $cm, stdClass $student): array {
    global $USER;

    $admin = $USER;
    $context = context_module::instance($cm->id);
    $assignment = new assign($context, $cm, $course);

    // Prefer Moodle's assign grading API over deleting grade rows; it keeps assign_grades and gradebook state aligned.
    $data = (object) [
        'grade' => '-1',
        'attemptnumber' => -1,
        'addattempt' => 0,
        'sendstudentnotifications' => false,
        'assignfeedbackcomments_editor' => [
            'text' => '',
            'format' => FORMAT_HTML,
            'itemid' => 0,
        ],
    ];

    $assignment->save_grade((int) $student->id, $data);

    $assignrecord = clone $assignment->get_instance();
    $assignrecord->cmidnumber = $cm->idnumber;
    assign_update_grades($assignrecord, (int) $student->id);

    \core\session\manager::set_user($admin);
    $USER = $admin;

    $grade = $assignment->get_user_grade((int) $student->id, true);

    return [
        'mode' => 'ungraded',
        'assignGrade' => (float) $grade->grade,
        'expectedBeforeUiGrade' => 'not graded',
    ];
}

function qa_read_grade_state(stdClass $course, stdClass $cm, stdClass $student): array {
    $context = context_module::instance($cm->id);
    $assignment = new assign($context, $cm, $course);
    $grade = $assignment->get_user_grade((int) $student->id, false);
    $assigngrade = ($grade && $grade->grade !== null) ? (float) $grade->grade : null;

    $gradinginfo = grade_get_grades((int) $course->id, 'mod', 'assign', (int) $cm->instance, (int) $student->id);
    // Items are keyed by itemnumber; grade_get_grades() includes every requested user once the item exists.
    $usergrade = $gradinginfo->items[0]->grades[(int) $student->id] ?? null;
    $gradebookgrade = null;

    if ($usergrade === null) {
        $gradebookstate = 'missing';
    } else if ($usergrade->grade === false) {
        // A failed gradebook regrade is reported as grade === false, which a float cast would turn into 0.
        $gradebookstate = 'regrade-error';
    } else if ($usergrade->grade === null) {
        $gradebookstate = 'ungraded';
    } else {
        $gradebookstate = 'graded';
        $gradebookgrade = (float) $usergrade->grade;
    }

    return [
        'assignGrade' => $assigngrade,
        'gradebookState' => $gradebookstate,
        'gradebookGrade' => $gradebookgrade,
        'regradeErrors' => qa_format_regrade_errors($gradinginfo->errors ?? []),
        'ungraded' => ($assigngrade === null || $assigngrade < 0) && $gradebookstate === 'ungraded',
    ];
}

function qa_format_regrade_errors(array $errors): array {
    $messages = [];

    foreach ($errors as $itemid => $error) {
        $messages[] = "grade item {$itemid}: " . (is_scalar($error) ? (string) $error : json_encode($error));
    }

    return $messages;
}
