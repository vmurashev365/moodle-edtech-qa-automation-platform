# Changelog

BDD vocabulary changes (steps, tags, feature names) are recorded here, as required by [AGENTS.md](AGENTS.md).

## Unreleased

### Tags

- Added `@ungraded-baseline`. Scenarios with this tag get a Before hook that resets Student QA's assignment grade to "not graded" before the scenario starts. Applied to the Phase 5 and Phase 6 features.
- Added `@phase7` for the role-access feature (`features/security/role-access.feature`), which also gains `@local` and loses `@wip`. Its `@smoke` scenario is now selected by `test:smoke`, `test:security` and `test:all`, which therefore need a seeded stack (`npm run moodle:seed:ready`). `test:fast:*`, `test:local:smoke` and `test:demo:smoke` select `@phase4` or `@api` only and are unchanged.
- Added `npm run test:local:security` (guarded, `@phase7 and @local and not @wip`). The role-access feature is in the `demo` paths, so `test:demo:all` runs it.

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

### Features

- Phase 5 scenario renamed from "Teacher opens assignment submissions from the controlled course" to "Teacher navigates from the dashboard to the deterministic submission ready for grading". It now clicks from the Dashboard instead of opening the course and assignment by URL. Phase 6 keeps direct links.
- Role based access (`features/security/role-access.feature`) is implemented locally; the scenario "Student cannot access teacher-only grading workflow" keeps its wording.
