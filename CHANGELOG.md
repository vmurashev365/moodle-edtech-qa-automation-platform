# Changelog

BDD vocabulary changes (steps, tags, feature names) are recorded here, as required by the [BDD Architecture](docs/BDD_ARCHITECTURE.md#governance-rules) governance rules.

## Unreleased

### One layer of domain steps

The Atomic → Domain → Composite step layers are replaced by one layer of domain steps ([BDD Architecture](docs/BDD_ARCHITECTURE.md)). Every implemented scenario now names its teacher, student, course, assignment and grade; steps look the names up in the seed artifact (`artifacts/seed/controlled-data.generated.json`) and an unknown name fails by name. No scenario reads generated IDs or URLs from `.env` any more. Earlier entries below describe steps as they were when added; this section says what replaced them.

Structure:

- Step definitions moved from `src/steps/domain/` to `src/steps/`.
- Removed the atomic steps `I navigate to the Moodle base URL`, `I open the Moodle path {string}` and `the current page title should include {string}`, and the pending composite step `the teacher completes assignment submission review workflow`. No feature used them.
- Removed `src/ui-map/`. The two selectors in use moved into `LoginPage`; selectors live in Page Objects.

Tags:

- Removed `@ungraded-baseline` and its Before hook. `student {string} has an ungraded submission for {string}` now resets the grade itself and verifies the result.
- A Before hook checks that the controlled Moodle is reachable for every `@local` scenario, so no scenario states it.

Steps shared by several scenarios:

- Implemented `teacher {string} is signed in`; `student {string} is signed in` now looks the username up the same way. After login the user menu must belong to that user. They replace `I log in as the configured teacher user`.
- Added `student {string} has an ungraded submission for {string}`. It resets the grade through Moodle's grading API, reads the state through the Moodle CLI, requires a submission and no grade, and makes this the submission the scenario is about. It replaces `controlled Moodle test data exists`, `controlled Moodle grading test data exists` and the pending `the controlled course has a submitted assignment ready for grading`.
- Removed `the controlled Moodle instance is available`.

Sign-in page (`features/smoke/controlled-moodle-login-smoke.feature`), feature renamed from "Controlled Moodle login smoke" to "Sign-in page":

- Scenario renamed from "Controlled Moodle login page is reachable" to "A visitor can reach the sign-in form".
- `I open the Moodle login page` became `a visitor opens the login page`; `the Moodle login form should be visible` became `the sign-in form is available`.

Teacher dashboard assignment review (`features/e2e/teacher-dashboard-assignment-review.feature`):

- Scenario renamed from "Teacher navigates from the dashboard to the deterministic submission ready for grading" to "A teacher reaches a student's submission from the dashboard".
- Added `the teacher opens {string} from the dashboard`. The quoted text is an item of Moodle's main menu from a closed list (`Home`, `Dashboard`, `My courses`); each item must open its page and any other text fails by name. It replaces `I open My courses from the dashboard`.
- Implemented `the teacher opens course {string}` and `the teacher opens assignment {string}`. Each clicks the link the current page lists and requires the page of that course or assignment. They replace `I open the controlled course from My courses`, `I open the controlled assignment from the course page` and the unused `I open the controlled course` and `I open the controlled assignment`.
- `I open the grading interface from the assignment page` became `the teacher opens grading for the assignment`.
- Added `the teacher sees the submission from student {string} as submitted and not graded`. It replaces `I should see the deterministic student submission`.

Teacher assignment grading (`features/e2e/teacher-assignment-grading.feature`):

- Scenario renamed from "Teacher grades deterministic student submission and gradebook reflects grade" to "A grade saved by the teacher reaches the gradebook unchanged".
- Added `the teacher grades the submission from student {string} as {string}`. The grade must be a whole number from 0 to the assignment's maximum grade. It replaces `I open the controlled assignment grading interface`, `I grade the deterministic student submission with the target grade` and the pending `the teacher grades the deterministic submission as {string}`.
- Implemented `the teacher opens the gradebook for {string}` and `the gradebook shows {string} for student {string}`. The grade is the exact text of the cell in the column of the assignment the scenario is about. They replace `I open the controlled gradebook` and `the gradebook should show the target grade for the deterministic student`.
- Added `the grade recorded for student {string} is {string} in both the assignment and the gradebook`. It replaces `Moodle should store the target grade for the deterministic student` and the pending `the assignment grade and gradebook grade are reconciled for student {string}`.

Role based access (`features/security/role-access.feature`), scenarios now under `Rule: Only a teacher can grade a submission`:

- "Student cannot access teacher-only grading workflow" became "A student cannot open the grading page". `the student attempts to open teacher-only grading for {string}` became `the student tries to open the grading page for that submission`; `access to teacher grading is denied` became `Moodle refuses with a permission error`. The checks and their order are unchanged.
- "Student cannot submit a grade through Moodle's grading service" became "A student cannot save a grade by sending the grading request directly". `the student attempts to submit a grade for {string} through Moodle's grading service` became `the student sends the grading request for that submission with grade {string}`; `Moodle rejects the grade submission for lack of grading permission` became `Moodle refuses with a permission error for grading`; `the deterministic student grade is still not graded in Moodle` became `the submission from student {string} is still not graded`.

Grades and evidence:

- The grade in the grading and role-access scenarios is the `82` written in the feature file. `MOODLE_TARGET_GRADE` now applies to the seed only.
- Every step that checks a value attaches a named comparison record (the rule, and per value: source, expected, actual, result) before asserting, and asserts from that record. For checks in the browser the existing page assertions still run; the record is read from the elements that hold just the compared values.
- JSON attachments made with `attachJson` carry their title as the attachment name.

### Tags

- Added `@ungraded-baseline`. Scenarios with this tag get a Before hook that resets Student QA's assignment grade to "not graded" before the scenario starts. Applied to the Phase 5 and Phase 6 features and to the Phase 7 grading service scenario.
- Added `@phase7` for the role-access feature (`features/security/role-access.feature`), which also gains `@local` and loses `@wip`. Its `@smoke` scenario is now selected by `test:smoke`, `test:security` and `test:all`, which therefore need a seeded stack (`npm run moodle:seed:ready`). `test:fast:*`, `test:local:smoke` and `test:demo:smoke` select `@phase4` or `@api` only and are unchanged.
- Added `npm run test:local:security` (guarded, `@phase7 and @local and not @wip`). The role-access feature is in the `demo` paths, so `test:demo:all` runs it.

### Commands

- Added `npm run test:unit` (Node's test runner through ts-node) for the comparison and seeded-data lookup logic; the Static Framework CI workflow runs it.
- Added `npm run test:local:all` (guarded, `@local and not @wip` across all feature files, after the grading data check) and `npm run test:local:screencast:all` (the screencast run without the seed; `test:demo:screencast:all` now seeds and calls it).
- Added `npm run ci:moodle-suite -- --suite <suite> --iterations <1-5>`, the command the Manual Moodle Test Run workflow runs. No tags or steps changed.
- Added `npm run evidence:package` (release assets of a passed run), `npm run evidence:secret-guard` (refuses assets that contain a credential value) and `npm run report:allure -- --single-file` (offline single-file report with inlined branding).

### Steps

- Removed `I open the submissions view`. It opened Moodle's single-user grading interface (`action=grader`), not the submissions table.
- Removed the unused `I open the controlled assignment submissions page` for the same reason.
- Added click-navigation steps for Phase 5:
  - `I open My courses from the dashboard`
  - `I open the controlled course from My courses`
  - `I open the controlled assignment from the course page`
  - `I open the grading interface from the assignment page`
- `I open the controlled course` and `I open the controlled assignment` (direct links from `.env`) are unchanged and no longer used by Phase 5.
- Renamed `the preflight result should report API token configuration status` to `the preflight result should report the API token status consistently with the environment`. The old step only checked that the status was a boolean. The new one checks that the preflight summary, `MoodleClient` and the missing-token warning all agree with `MOODLE_API_TOKEN`; a whitespace-only token counts as not configured everywhere.
- Added `Moodle should store the target grade for the deterministic student` (Phase 6, after the gradebook UI check). It reads the stored grade through the Moodle CLI (`scripts/moodle/read-grade-state.php`, read-only) and requires the assignment grade to equal `MOODLE_TARGET_GRADE`, the gradebook state to be `graded` and the gradebook grade to equal the target. A regrade error and a missing grade item fail with their own messages. This is a backend check, not Moodle Web Services coverage.
- `I grade the deterministic student submission with the target grade` now requires the "Current grade in gradebook" value to equal the formatted target grade exactly (`82.00`), instead of the field merely containing it (which `182.00` also satisfied).
- Implemented `student {string} is signed in`. The username must equal `MOODLE_STUDENT_USERNAME`; after login the user menu must belong to `MOODLE_STUDENT_DISPLAY_NAME`.
- Implemented `the student attempts to open teacher-only grading for {string}`. The name must equal `MOODLE_ASSIGNMENT_NAME`; it opens the single-user grading URL (`action=grader&userid=<student>`) and records the HTTP status.
- Implemented `access to teacher grading is denied`. In order: the page is not the login page and the user menu still belongs to the student; Moodle shows its `error/nopermission` error on the grading URL with HTTP 404; only then, no `Grade out of` input, no `Save changes` action and no login form.
- `teacher {string} is signed in` is still pending.
- Added `the student attempts to submit a grade for {string} through Moodle's grading service`. The name must equal `MOODLE_ASSIGNMENT_NAME`. It reads the grade state through the Moodle CLI and requires it to be not graded, then, from the student's page with the student's session key, sends the request the grading panel sends on Save changes (`mod_assign_submit_grading_form`, assign instance id, `MOODLE_TARGET_GRADE`).
- Added `Moodle rejects the grade submission for lack of grading permission`. Requires errorcode `nopermissions` with the message for `mod/assign:grade` ("Grade assignment"). Acceptance, form-validation warnings (`couldnotsavegrade`) and other errorcodes fail with their own messages.
- Added `the deterministic student grade is still not graded in Moodle`. Reads the grade state through the Moodle CLI again and requires it to be not graded and identical to the state before the attempt.
- `scripts/moodle/read-grade-state.php` also reports `assignmentInstanceId`, which the grading service takes instead of the cmid.

### Features

- Phase 5 scenario renamed from "Teacher opens assignment submissions from the controlled course" to "Teacher navigates from the dashboard to the deterministic submission ready for grading". It now clicks from the Dashboard instead of opening the course and assignment by URL. Phase 6 keeps direct links.
- Role based access (`features/security/role-access.feature`) is implemented locally; the scenario "Student cannot access teacher-only grading workflow" keeps its wording.
- Added the scenario "Student cannot submit a grade through Moodle's grading service" (`@ungraded-baseline`) to the role-access feature.
