# Test Data Strategy

## Purpose
This document defines the controlled Moodle data model required for stable automation. It translates the Phase 1 test plan and risk analysis into practical data contracts for Phase 3 implementation.

The goal is repeatable, traceable test data for Moodle teacher workflows without relying on public demo state.

## Controlled Environment Principle
Stable automated tests must run against a controlled Moodle instance, such as local Docker or a dedicated VPS, seeded with deterministic data. Test runs should be able to verify, create, reset, and clean up data through API-backed helpers where the configured Moodle environment allows it.

The controlled environment should provide:

- Known users and roles.
- Known course, assignment, submission, grade, and media resource.
- Repeatable setup and teardown.
- Clear separation between test data and human exploratory data.
- No committed secrets or `.env` files.

## Public Demo Vs Controlled Moodle
Mount Orange Moodle demo is useful for recon, vocabulary discovery, and manual observation only. It must not be treated as a stable automation target because public data, availability, roles, and UI state can change without notice.

CI and repeatable local automation should target controlled Moodle only.

## Seeded Users
Final usernames may be adapted to the actual Moodle setup, but the logical roles and scenario vocabulary should remain stable.

| Logical role | Username placeholder | Purpose | Permissions needed | Used by scenarios |
|---|---|---|---|---|
| manager/admin | `manager.qa` | Environment preflight, seed verification, controlled setup support. | Site administration or sufficient Web Service permissions for test setup and validation. | API preflight, seed setup, teardown checks |
| teacher | `teacher.qa` | Primary actor for dashboard, course, assignment, submission review, grading, and gradebook validation. | Teacher role in `QA Automation Demo 101`; access to assignment submissions and grading. | Teacher E2E, UI checks, grade workflow |
| student | `student.qa` | Learner actor with deterministic submission and grade visibility. | Student role in `QA Automation Demo 101`; access to course, assignment, submission, gradebook/grade view as configured. | Submission setup, student-visible grade, media smoke |
| optional unenrolled student | `outsider.student.qa` | Negative access actor for restricted course and assignment checks. | Authenticated user without enrolment in the controlled course. | Future role/permission negative checks |

## Course And Assignment Data
Controlled business data:

| Data item | Stable vocabulary | Purpose | Notes |
|---|---|---|---|
| Course | `QA Automation Demo 101` | Primary course for teacher and student workflows. | Final course short name or ID may vary by setup. |
| Assignment | `Essay: Test Automation Strategy` | Target assignment for submission and grading workflows. | Should allow deterministic submission and grading. |
| Audio resource | `Sample Listening Task` | Media/audio smoke check target. | Should expose visible audio controls to the intended learner role. |

The scenario vocabulary should use these names unless the controlled environment requires a carefully documented rename.

## Submission And Grading Data
Controlled grading data:

| Data item | Stable value | Purpose | Notes |
|---|---|---|---|
| Submission | Deterministic test submission from `student.qa` | Gives the teacher a known work item to review. | Content can be a simple text or file submission depending on Moodle configuration. |
| Grade | `82 / 100` | Validates save, persistence, student visibility, and gradebook reconciliation. | Final scale must match assignment configuration. |
| Feedback | Deterministic teacher feedback, if enabled | Optional validation of feedback persistence. | Add only if the assignment workflow supports it reliably. |

## Data Lifecycle
The target lifecycle for Phase 3 automation:

1. Preflight confirms the controlled Moodle instance is reachable.
2. Seed verification confirms required users, roles, course, assignment, submission, grade scale, and audio resource exist.
3. Scenario setup creates or resets only the data needed for the scenario.
4. UI and API validations use the same logical data references.
5. Teardown removes temporary records or resets deterministic records to the baseline.
6. Evidence records what data was used without exposing credentials or secrets.

## API-Backed Setup And Teardown
API helpers should support:

- Site readiness and authentication checks.
- User lookup by username placeholder.
- Role/enrolment verification.
- Course and assignment lookup.
- Submission creation or reset where supported.
- Grade reset and grade assertion.
- Gradebook reconciliation checks.
- Cleanup of records created during the run.

Exact Moodle Web Service function names must be confirmed during Phase 3 against the configured Moodle Web Services.

## Test Data Naming Conventions
Use names that are explicit, stable, and clearly marked as QA data:

- Usernames: `manager.qa`, `teacher.qa`, `student.qa`, `outsider.student.qa`.
- Course full name: `QA Automation Demo 101`.
- Assignment name: `Essay: Test Automation Strategy`.
- Audio resource name: `Sample Listening Task`.
- Temporary data prefix: `qa-auto-`.
- Run marker, if needed: `qa-auto-{yyyyMMdd-HHmmss}` or a CI run ID.

Avoid production-like personal data. Use neutral names and deterministic content.

## Data Isolation And Cleanup
Data isolation should prevent one run from changing the result of another run.

Recommended controls:

- Prefer API setup over UI setup for speed and reliability.
- Track created records in scenario context during implementation.
- Clean up even when the UI scenario fails.
- Reset grades and submissions to known baseline before scenarios that mutate them.
- Avoid hardcoded assumptions that are not verified in setup.
- Keep Mount Orange recon data out of automated runs and evidence claims.

## Risks And Mitigations

| Risk | Mitigation |
|---|---|
| Public demo instability causes false failures. | Use Mount Orange for recon only; CI targets controlled Moodle. |
| Test data pollution changes gradebook or submission state. | Reset deterministic records before mutation and clean up temporary data after runs. |
| User permissions drift from expected roles. | API preflight verifies enrolments and required capabilities before UI execution. |
| Assignment grade scale changes. | Preflight confirms the assignment supports `82 / 100` or maps the stable vocabulary to the configured scale. |
| Moodle Web Services are not enabled or do not expose required operations. | Mark affected helpers as blocked by environment and document manual seed steps until enabled. |
| Secrets leak into docs or repo. | Use environment variables or CI secrets; never commit `.env`, tokens, screenshots with credentials, or generated artifacts. |

## Phase 2 / Phase 3 Implementation Notes
Phase 2 defines the data contracts only. It does not add seed scripts, fixtures, API clients, feature files, or step definitions.

Phase 3 should implement the smallest useful data helper layer first:

- Controlled Moodle preflight.
- User and enrolment lookup.
- Course and assignment lookup.
- Submission and grade reset/assertion.
- Gradebook reconciliation.

If the controlled environment cannot support API mutation immediately, Phase 3 may begin with API validation plus documented manual seed preparation, with mutation helpers added after Web Services are configured.
