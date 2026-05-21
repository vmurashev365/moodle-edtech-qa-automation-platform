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

| Logical role                    | Username placeholder              | Purpose                                                                                                        | Permissions needed                                                                                                                                                                                         | Used by scenarios                                    |
| ------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| built-in admin / future manager | Moodle image admin / `manager.qa` | Local setup uses the Moodle image's built-in admin. `manager.qa` is planned for later role/security expansion. | Site administration or sufficient Web Service permissions for future test setup and validation. The current local seed does not create `manager.qa`.                                                       | API preflight, future seed setup, teardown checks    |
| teacher                         | `teacher.qa`                      | Primary actor for dashboard, course, assignment, submission review, grading, and gradebook validation.         | Teacher role in `QA Automation Demo 101`; access to assignment submissions and grading.                                                                                                                    | Teacher E2E, UI checks, grade workflow               |
| student                         | `student.qa`                      | Learner actor with deterministic submission and grade visibility.                                              | Student role in `QA Automation Demo 101`; access to course, assignment, submission, gradebook/grade view as configured. Display name should match `MOODLE_STUDENT_DISPLAY_NAME`, for example `Student QA`. | Submission setup, student-visible grade, media smoke |
| optional unenrolled student     | `outsider.student.qa`             | Negative access actor for restricted course and assignment checks.                                             | Authenticated user without enrolment in the controlled course.                                                                                                                                             | Future role/permission negative checks               |

## Course And Assignment Data

Controlled business data:

| Data item      | Stable vocabulary                 | Purpose                                                 | Notes                                                              |
| -------------- | --------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| Course         | `QA Automation Demo 101`          | Primary course for teacher and student workflows.       | Final course short name or ID may vary by setup.                   |
| Assignment     | `Essay: Test Automation Strategy` | Target assignment for submission and grading workflows. | Should allow deterministic submission and grading.                 |
| Audio resource | `Sample Listening Task`           | Media/audio smoke check target.                         | Should expose visible audio controls to the intended learner role. |

The scenario vocabulary should use these names unless the controlled environment requires a carefully documented rename.

## Submission And Grading Data

Controlled grading data:

| Data item  | Stable value                                    | Purpose                                                                        | Notes                                                                              |
| ---------- | ----------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Submission | Deterministic test submission from `student.qa` | Gives the teacher a known work item to review.                                 | Content can be a simple text or file submission depending on Moodle configuration. |
| Grade      | `82 / 100`                                      | Validates save, persistence, student visibility, and gradebook reconciliation. | Seed resets the controlled grade to ungraded before the UI scenario writes `82`.   |
| Feedback   | Deterministic teacher feedback, if enabled      | Optional validation of feedback persistence.                                   | Add only if the assignment workflow supports it reliably.                          |

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

- Usernames: `teacher.qa`, `student.qa`, and future role-expansion users such as `manager.qa` or `outsider.student.qa`.
- Student display name: `Student QA` or the exact configured `MOODLE_STUDENT_DISPLAY_NAME`.
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

| Risk                                                                      | Mitigation                                                                                                                  |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Public demo instability causes false failures.                            | Use Mount Orange for recon only; CI targets controlled Moodle.                                                              |
| Test data pollution changes gradebook or submission state.                | Reset deterministic records before mutation and clean up temporary data after runs.                                         |
| User permissions drift from expected roles.                               | API preflight verifies enrolments and required capabilities before UI execution.                                            |
| Assignment grade scale changes.                                           | Preflight confirms the assignment supports `82 / 100` or maps the stable vocabulary to the configured scale.                |
| Moodle Web Services are not enabled or do not expose required operations. | Use the local Docker internal seed for baseline data and mark Web Service-specific helpers as blocked until enabled.        |
| Secrets leak into docs or repo.                                           | Use environment variables or CI secrets; never commit `.env`, tokens, screenshots with credentials, or generated artifacts. |

## Phase 2 / Phase 3 Implementation Notes

Phase 2 defines the data contracts only. It does not add seed scripts, fixtures, API clients, feature files, or step definitions.

Phase 3 should implement the smallest useful data helper layer first:

- Controlled Moodle preflight.
- User and enrolment lookup.
- Course and assignment lookup.
- Submission and grade reset/assertion.
- Gradebook reconciliation.

If the controlled environment cannot support Web Service mutation immediately, keep Web Service helpers scoped to validation and use the local Docker internal seed for the baseline data this repository owns.

## Phase 4 / Phase 5 Provisioning Note

Phase 4 introduces a local login-page smoke that verifies Moodle reachability and the login form only. It does not require seeded teacher/student users, course, assignment, submission, or grade data.

Phase 5 can now use the local controlled seed command instead of manual setup:

```bash
npm run moodle:start
npm run moodle:wait
npm run moodle:seed
npm run moodle:seed:env
```

The seed runs inside the Docker Moodle container and uses Moodle internal APIs for user creation/update, course creation/update, manual enrolments, assignment creation/update, online text submission setup, and assignment grade reset. It creates or confirms:

- controlled teacher and student users
- built-in Moodle admin remains image-provided; `manager.qa` is not seeded yet
- student username `student.qa` with display name `Student QA` or the exact configured `MOODLE_STUDENT_DISPLAY_NAME`
- `QA Automation Demo 101`
- `Essay: Test Automation Strategy`
- deterministic student submission
- Student QA grade reset to Moodle's ungraded baseline through the assign grading API
- teacher and student enrolments in the controlled course
- generated local `.env` values for course, assignment, student ID, student email, submission ID, submissions URL, single-user grading URL, gradebook URL, student display name, and target grade

The seed writes ignored local metadata to `artifacts/seed/controlled-data.generated.json`. `npm run moodle:seed:env` explicitly applies deterministic metadata from the generated `envSnippet` to the untracked local `.env`, creating `.env` from `.env.example` if needed and creating a timestamped `.env.backup.*` before editing an existing file. Generated URLs use Moodle's configured local `wwwroot` so browser login sessions stay aligned with the running instance. That generated artifact is useful for local setup and review, but it is not public proof by itself. The Phase 5 workflow reviews the deterministic submission from the teacher perspective. The Phase 6 workflow writes the target grade through the Moodle UI and verifies the gradebook row. Backend validation through Moodle Web Services remains future work.

## Phase 6 Grading / Gradebook Readiness

Phase 6 targets the business-critical teacher grading and gradebook reconciliation path. The local controlled Moodle instance must contain:

- deterministic `Student QA` submission visible to the teacher
- configured assignment submissions URL or assignment module ID
- configured gradebook URL or course ID
- assignment grade scale that accepts the configured target grade, default `82`
- generated single-user grading URL for Student QA
- seed-reset ungraded baseline before each grading run

Use `npm run moodle:seed:ready` before attempting the grading workflow. The seed creates the deterministic submission and resets the grade to Moodle's ungraded baseline; it does not pre-grade with the target grade. Mission 6 Recorder/Codegen selector evidence is local under ignored `tools/recordings/localhost_mission6`.

GitHub Actions remains static/safe and does not start Moodle, run live Moodle E2E, or publish generated local seed artifacts.
