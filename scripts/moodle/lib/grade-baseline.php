<?php

declare(strict_types=1);

// Shared by seed-controlled-data.php and reset-ungraded-baseline.php. Callers must load Moodle
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
    $gradebookgrade = $gradinginfo->items[0]->grades[(int) $student->id]->grade ?? null;
    $gradebookgrade = $gradebookgrade === null ? null : (float) $gradebookgrade;

    return [
        'assignGrade' => $assigngrade,
        'gradebookGrade' => $gradebookgrade,
        'ungraded' => ($assigngrade === null || $assigngrade < 0) && $gradebookgrade === null,
    ];
}
