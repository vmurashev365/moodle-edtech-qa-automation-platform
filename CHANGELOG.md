# Changelog

BDD vocabulary changes (steps, tags, feature names) are recorded here, as required by [AGENTS.md](AGENTS.md).

## Unreleased

### Tags

- Added `@ungraded-baseline`. Scenarios with this tag get a Before hook that resets Student QA's assignment grade to "not graded" before the scenario starts. Applied to the Phase 5 and Phase 6 features.

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

### Features

- Phase 5 scenario renamed from "Teacher opens assignment submissions from the controlled course" to "Teacher navigates from the dashboard to the deterministic submission ready for grading". It now clicks from the Dashboard instead of opening the course and assignment by URL. Phase 6 keeps direct links.
