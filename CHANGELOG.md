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

### Features

- Phase 5 scenario renamed from "Teacher opens assignment submissions from the controlled course" to "Teacher navigates from the dashboard to the deterministic submission ready for grading". It now clicks from the Dashboard instead of opening the course and assignment by URL. Phase 6 keeps direct links.
