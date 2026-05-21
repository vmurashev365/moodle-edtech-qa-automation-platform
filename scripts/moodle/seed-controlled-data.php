<?php

declare(strict_types=1);

define('CLI_SCRIPT', true);

function seed_fail(string $message): void {
    fwrite(STDERR, "Controlled Moodle seed failed: {$message}" . PHP_EOL);
    exit(1);
}

function seed_env(string $name, string $default): string {
    $value = getenv($name);

    if ($value === false || trim((string) $value) === '') {
        return $default;
    }

    return trim((string) $value);
}

function seed_find_config(): string {
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

    seed_fail('Could not find Moodle config.php in the known container paths.');
}

function seed_split_display_name(string $displayname): array {
    $parts = preg_split('/\s+/', trim($displayname));

    if ($parts === false || count($parts) === 0 || $parts[0] === '') {
        return ['Student', 'QA'];
    }

    $firstname = array_shift($parts);
    $lastname = count($parts) > 0 ? implode(' ', $parts) : 'QA';

    return [$firstname, $lastname];
}

function seed_build_url(string $baseurl, string $path): string {
    return rtrim($baseurl, '/') . '/' . ltrim($path, '/');
}

require_once seed_find_config();

global $CFG, $DB, $USER;

$CFG->noemailever = true;

require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/course/modlib.php');
require_once($CFG->dirroot . '/enrol/manual/locallib.php');
require_once($CFG->dirroot . '/mod/assign/lib.php');
require_once($CFG->dirroot . '/mod/assign/locallib.php');

$requestedbaseurl = seed_env('MOODLE_BASE_URL', 'http://localhost:8080');
$baseurl = !empty($CFG->wwwroot) ? (string) $CFG->wwwroot : $requestedbaseurl;
$teacherusername = seed_env('MOODLE_TEACHER_USERNAME', 'teacher.qa');
$teacherpassword = seed_env('MOODLE_TEACHER_PASSWORD', 'changeme');
$studentusername = seed_env('MOODLE_STUDENT_USERNAME', 'student.qa');
$studentpassword = seed_env('MOODLE_STUDENT_PASSWORD', 'changeme');
$studentdisplayname = seed_env('MOODLE_STUDENT_DISPLAY_NAME', 'Student QA');
$studentemail = seed_env('MOODLE_STUDENT_EMAIL', 'student.qa@example.test');
$coursename = seed_env('MOODLE_COURSE_NAME', 'QA Automation Demo 101');
$assignmentname = seed_env('MOODLE_ASSIGNMENT_NAME', 'Essay: Test Automation Strategy');
$targetgrade = (int) seed_env('MOODLE_TARGET_GRADE', '82');
$courseshortname = 'QA101';
$courseidnumber = 'qa-automation-demo-101';
$submissiontext = 'This is a deterministic QA automation strategy submission for the Moodle EdTech demo.';
$notes = [];

if (rtrim($requestedbaseurl, '/') !== rtrim($baseurl, '/')) {
    $notes[] = "Generated URLs use Moodle wwwroot {$baseurl} so browser sessions stay aligned with the local Moodle instance.";
}

try {
    $admin = get_admin();
    \core\session\manager::set_user($admin);
    $USER = $admin;

    if (seed_ensure_manual_auth_enabled()) {
        $notes[] = 'Manual authentication was enabled for local controlled Moodle users.';
    }

    [$studentfirstname, $studentlastname] = seed_split_display_name($studentdisplayname);

    $teacher = seed_upsert_user(
        $teacherusername,
        'Teacher',
        'QA',
        'teacher.qa@example.test',
        $teacherpassword
    );
    $student = seed_upsert_user(
        $studentusername,
        $studentfirstname,
        $studentlastname,
        $studentemail,
        $studentpassword
    );
    $course = seed_upsert_course($coursename, $courseshortname, $courseidnumber);
    $teacherrole = seed_role_id(['editingteacher', 'teacher']);
    $studentrole = seed_role_id(['student']);

    seed_ensure_manual_enrolment($course, $teacher, $teacherrole);
    seed_ensure_manual_enrolment($course, $student, $studentrole);

    $assignment = seed_upsert_assignment($course, $assignmentname);
    $assignment['submission'] = seed_ensure_online_text_submission($course, $assignment['cm'], $student, $submissiontext);
    $gradebaseline = seed_reset_grade_to_ungraded($course, $assignment['cm'], $student);

    $courseurl = seed_build_url($baseurl, "/course/view.php?id={$course->id}");
    $assignmenturl = seed_build_url($baseurl, "/mod/assign/view.php?id={$assignment['cm']->id}");
    $submissionsurl = $assignmenturl . '&action=grading';
    $assignmentgradingurl = $assignmenturl . '&action=grader&userid=' . (int) $student->id;
    $gradebookurl = seed_build_url($baseurl, "/grade/report/grader/index.php?id={$course->id}");

    $output = [
        'generatedAt' => gmdate('c'),
        'baseUrl' => $baseurl,
        'users' => [
            'teacher' => [
                'id' => (int) $teacher->id,
                'username' => $teacher->username,
                'displayName' => fullname($teacher),
                'email' => $teacher->email,
            ],
            'student' => [
                'id' => (int) $student->id,
                'username' => $student->username,
                'displayName' => fullname($student),
                'email' => $student->email,
            ],
        ],
        'course' => [
            'id' => (int) $course->id,
            'shortName' => $course->shortname,
            'fullName' => $course->fullname,
            'idNumber' => $course->idnumber,
            'url' => $courseurl,
        ],
        'assignment' => [
            'instanceId' => (int) $assignment['assign']->id,
            'cmid' => (int) $assignment['cm']->id,
            'name' => $assignment['assign']->name,
            'url' => $assignmenturl,
            'submissionsUrl' => $submissionsurl,
            'gradingUrl' => $assignmentgradingurl,
            'maxGrade' => 100,
        ],
        'submission' => [
            'id' => (int) $assignment['submission']->id,
            'status' => $assignment['submission']->status,
            'text' => $submissiontext,
        ],
        'gradebook' => [
            'url' => $gradebookurl,
            'targetGrade' => $targetgrade,
            'baseline' => $gradebaseline,
        ],
        'envSnippet' => [
            'MOODLE_COURSE_ID' => (string) $course->id,
            'MOODLE_ASSIGNMENT_ID' => (string) $assignment['cm']->id,
            'MOODLE_STUDENT_ID' => (string) $student->id,
            'MOODLE_STUDENT_EMAIL' => $student->email,
            'MOODLE_SUBMISSION_ID' => (string) $assignment['submission']->id,
            'MOODLE_COURSE_URL' => $courseurl,
            'MOODLE_ASSIGNMENT_URL' => $assignmenturl,
            'MOODLE_ASSIGNMENT_SUBMISSIONS_URL' => $submissionsurl,
            'MOODLE_ASSIGNMENT_GRADING_URL' => $assignmentgradingurl,
            'MOODLE_GRADEBOOK_URL' => $gradebookurl,
            'MOODLE_STUDENT_DISPLAY_NAME' => fullname($student),
            'MOODLE_TARGET_GRADE' => (string) $targetgrade,
        ],
        'notes' => $notes,
    ];

    echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
} catch (Throwable $error) {
    seed_fail($error->getMessage());
}

function seed_ensure_manual_auth_enabled(): bool {
    global $CFG;

    $enabled = [];

    if (!empty($CFG->auth)) {
        $enabled = array_values(array_filter(array_map('trim', explode(',', (string) $CFG->auth))));
    }

    if (in_array('manual', $enabled, true)) {
        return false;
    }

    array_unshift($enabled, 'manual');
    $enabled = array_values(array_unique($enabled));
    $authsequence = implode(',', $enabled);

    set_config('auth', $authsequence);
    $CFG->auth = $authsequence;

    return true;
}

function seed_upsert_user(string $username, string $firstname, string $lastname, string $email, string $password): stdClass {
    global $CFG, $DB;

    $existing = $DB->get_record('user', [
        'username' => $username,
        'mnethostid' => $CFG->mnet_localhost_id,
        'deleted' => 0,
    ]);

    $user = (object) [
        'auth' => 'manual',
        'confirmed' => 1,
        'mnethostid' => $CFG->mnet_localhost_id,
        'username' => $username,
        'firstname' => $firstname,
        'lastname' => $lastname,
        'email' => $email,
        'maildisplay' => 0,
        'city' => 'QA',
        'country' => 'US',
        'timezone' => '99',
    ];

    if ($existing) {
        $user->id = $existing->id;
        user_update_user($user, false, false);
    } else {
        $user->id = user_create_user($user, false, false);
    }

    $saved = $DB->get_record('user', ['id' => $user->id], '*', MUST_EXIST);
    update_internal_user_password($saved, $password, true);
    unset_user_preference('auth_forcepasswordchange', $saved);

    return $DB->get_record('user', ['id' => $user->id], '*', MUST_EXIST);
}

function seed_upsert_course(string $fullname, string $shortname, string $idnumber): stdClass {
    global $DB;

    $course = $DB->get_record('course', ['idnumber' => $idnumber]);

    if (!$course) {
        $course = $DB->get_record('course', ['shortname' => $shortname]);
    }

    $category = \core_course_category::get_default();
    $courseconfig = (object) [
        'fullname' => $fullname,
        'shortname' => $shortname,
        'idnumber' => $idnumber,
        'category' => $category->id,
        'visible' => 1,
        'format' => 'topics',
        'numsections' => 1,
        'summary' => 'Controlled Moodle QA automation course.',
        'summaryformat' => FORMAT_HTML,
        'startdate' => time() - DAYSECS,
        'enddate' => 0,
    ];

    if ($course) {
        $courseconfig->id = $course->id;
        update_course($courseconfig);
        return $DB->get_record('course', ['id' => $course->id], '*', MUST_EXIST);
    }

    return create_course($courseconfig);
}

function seed_role_id(array $shortnames): int {
    global $DB;

    foreach ($shortnames as $shortname) {
        $role = $DB->get_record('role', ['shortname' => $shortname]);

        if ($role) {
            return (int) $role->id;
        }
    }

    seed_fail('Could not find Moodle role for any of: ' . implode(', ', $shortnames));
}

function seed_ensure_manual_enrolment(stdClass $course, stdClass $user, int $roleid): void {
    $manual = enrol_get_plugin('manual');

    if (!$manual) {
        seed_fail('Manual enrolment plugin is not available in this Moodle instance.');
    }

    $instances = enrol_get_instances($course->id, true);
    $manualinstance = null;

    foreach ($instances as $instance) {
        if ($instance->enrol === 'manual') {
            $manualinstance = $instance;
            break;
        }
    }

    if (!$manualinstance) {
        $instanceid = $manual->add_instance($course, ['status' => ENROL_INSTANCE_ENABLED]);
        $instances = enrol_get_instances($course->id, true);
        $manualinstance = $instances[$instanceid] ?? null;
    }

    if (!$manualinstance) {
        seed_fail("Could not create or locate manual enrolment instance for course {$course->shortname}.");
    }

    $context = context_course::instance($course->id);

    if (!is_enrolled($context, $user, '', true) || !user_has_role_assignment($user->id, $roleid, $context->id)) {
        $manual->enrol_user($manualinstance, $user->id, $roleid, time(), 0, ENROL_USER_ACTIVE);
    }
}

function seed_assignment_data(stdClass $course, string $assignmentname): stdClass {
    global $DB;

    return (object) [
        'course' => $course->id,
        'module' => $DB->get_field('modules', 'id', ['name' => 'assign'], MUST_EXIST),
        'modulename' => 'assign',
        'section' => 0,
        'name' => $assignmentname,
        'intro' => 'Controlled assignment for Moodle EdTech QA automation.',
        'introformat' => FORMAT_HTML,
        'introeditor' => [
            'text' => 'Controlled assignment for Moodle EdTech QA automation.',
            'format' => FORMAT_HTML,
            'itemid' => 0,
        ],
        'alwaysshowdescription' => 1,
        'submissiondrafts' => 0,
        'requiresubmissionstatement' => 0,
        'sendnotifications' => 0,
        'sendstudentnotifications' => 0,
        'sendlatenotifications' => 0,
        'duedate' => 0,
        'allowsubmissionsfromdate' => time() - DAYSECS,
        'cutoffdate' => 0,
        'gradingduedate' => 0,
        'teamsubmission' => 0,
        'requireallteammemberssubmit' => 0,
        'blindmarking' => 0,
        'attemptreopenmethod' => 'none',
        'maxattempts' => ASSIGN_UNLIMITED_ATTEMPTS,
        'markingworkflow' => 0,
        'markingallocation' => 0,
        'grade' => 100,
        'visible' => 1,
        'availability' => null,
        'assignsubmission_onlinetext_enabled' => 1,
        'assignsubmission_file_enabled' => 0,
        'assignfeedback_comments_enabled' => 1,
    ];
}

function seed_upsert_assignment(stdClass $course, string $assignmentname): array {
    global $DB;

    $assign = $DB->get_record('assign', [
        'course' => $course->id,
        'name' => $assignmentname,
    ]);
    $data = seed_assignment_data($course, $assignmentname);

    if ($assign) {
        $cm = get_coursemodule_from_instance('assign', $assign->id, $course->id, false, MUST_EXIST);
        $data->id = $assign->id;
        $data->instance = $assign->id;
        $data->coursemodule = $cm->id;
        assign_update_instance($data, null);
        set_coursemodule_visible($cm->id, 1);
    } else {
        $created = seed_add_module($data, $course);
        $cm = get_coursemodule_from_id('assign', $created->coursemodule, $course->id, false, MUST_EXIST);
    }

    rebuild_course_cache((int) $course->id, true);

    $assign = $DB->get_record('assign', [
        'course' => $course->id,
        'name' => $assignmentname,
    ], '*', MUST_EXIST);
    $cm = get_coursemodule_from_instance('assign', $assign->id, $course->id, false, MUST_EXIST);

    return [
        'assign' => $assign,
        'cm' => $cm,
        'submission' => null,
    ];
}

function seed_add_module(stdClass $data, stdClass $course): stdClass {
    if (function_exists('create_module')) {
        $createfunction = new ReflectionFunction('create_module');

        if ($createfunction->getNumberOfParameters() === 1) {
            return create_module($data);
        }

        return create_module($data, $course);
    }

    if (function_exists('add_moduleinfo')) {
        return add_moduleinfo($data, $course);
    }

    seed_fail('This Moodle instance does not expose create_module() or add_moduleinfo().');
}

function seed_ensure_online_text_submission(
    stdClass $course,
    stdClass $cm,
    stdClass $student,
    string $submissiontext
): stdClass {
    global $USER;

    $admin = $USER;
    $student = clone $student;
    \core\session\manager::set_user($student);
    $USER = $student;

    $context = context_module::instance($cm->id);
    $assignment = new assign($context, $cm, $course);
    $submission = $assignment->get_user_submission($student->id, true);
    $plugin = $assignment->get_submission_plugin_by_type('onlinetext');

    if (!$plugin || !$plugin->is_enabled()) {
        seed_fail('Online text submission plugin is not enabled for the controlled assignment.');
    }

    $data = (object) [
        'id' => $cm->id,
        'onlinetext_editor' => [
            'text' => $submissiontext,
            'format' => FORMAT_HTML,
            'itemid' => 0,
        ],
    ];
    $notices = [];
    $plugin->save($submission, $data);

    if ($submission->status !== ASSIGN_SUBMISSION_STATUS_SUBMITTED) {
        $submitdata = (object) [
            'id' => $cm->id,
            'submissionstatement' => 0,
        ];
        $assignment->submit_for_grading($submitdata, $notices);
    }

    \core\session\manager::set_user($admin);
    $USER = $admin;

    $submission = $assignment->get_user_submission($student->id, false);
    return $submission;
}

function seed_reset_grade_to_ungraded(stdClass $course, stdClass $cm, stdClass $student): array {
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
