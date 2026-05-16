# API Coverage Matrix

## Purpose
This document defines planned Moodle Web Services / API helper coverage for Phase 3 test data setup, teardown, and backend validation.

It avoids committing to exact Moodle API function names before the controlled Moodle instance and enabled Web Services are verified.

## Why API Coverage Matters
API-backed validation gives the framework a stable source of truth for setup and reconciliation. UI checks prove the teacher and student experience; API checks confirm the underlying Moodle state that drives that experience.

For grading and gradebook workflows, API coverage is especially important because UI-only checks may miss state drift, stale displays, or incomplete persistence.

## API Coverage Groups
Target coverage range: 15-20 planned checks, with a broader candidate backlog of 23 checks documented below. Final Phase 3 scope should implement the P0 helpers first and keep environment-blocked checks explicit.

Planned groups:

- Auth/site info: 2 checks.
- Users/roles: 3 checks.
- Courses: 3 checks.
- Enrolments: 3 checks.
- Assignments: 3 checks.
- Submissions: 3 checks.
- Grades/gradebook: 4 checks.
- Negative access/token checks: 2 checks.

## Planned API Checks

| API group | Planned helper responsibility | Example check | Supports scenario(s) | Priority | Status | Notes / function confirmation needed |
|---|---|---|---|---|---|---|
| Auth/site info | Confirm controlled Moodle is reachable. | Site info or health-style response confirms expected host. | All suites | P0 | Designed | Candidate Moodle Web Service area; function name to be confirmed against configured Moodle Web Services. |
| Auth/site info | Confirm API credentials/token are valid for allowed helper operations. | Manager/admin token can perform configured read/preflight checks. | API preflight, setup | P0 | Designed | Token scope and authentication method to be verified during implementation. |
| Users/roles | Resolve seeded user by username placeholder. | `teacher.qa`, `student.qa`, and `manager.qa` can be found. | Auth, dashboard, assignment, grading | P0 | Designed | User lookup function name to be confirmed. |
| Users/roles | Verify user role assignment in target course. | `teacher.qa` has teacher role in `QA Automation Demo 101`. | Teacher course access | P0 | Designed | Role/capability source to be confirmed. |
| Users/roles | Verify optional negative user role state. | `outsider.student.qa` is authenticated but not enrolled in the course. | Permission negative checks | P1 | Future expansion | May be environment-dependent. |
| Courses | Resolve controlled course by stable vocabulary. | `QA Automation Demo 101` exists and is visible to the expected roles. | Dashboard, course access | P0 | Designed | Course identifier fields to be confirmed. |
| Courses | Confirm teacher course access. | Teacher is assigned to the controlled course. | Teacher dashboard, course open | P0 | Designed | Could overlap with enrolment helper; avoid duplicate implementation if one source is authoritative. |
| Courses | Confirm student course access. | `student.qa` is enrolled in the controlled course. | Student grade, media smoke | P0 | Designed | Function name to be confirmed. |
| Enrolments | Verify teacher enrolment. | Teacher enrolment exists and is active. | Teacher course access | P0 | Designed | Candidate enrolment Web Service area; function name to be confirmed. |
| Enrolments | Verify student enrolment. | Student enrolment exists and is active. | Student submission and grade visibility | P0 | Designed | Function name to be confirmed. |
| Enrolments | Verify unenrolled access boundary. | `outsider.student.qa` has no active enrolment for the controlled course. | Negative access | P1 | Future expansion | Required only if optional negative actor is provisioned. |
| Assignments | Resolve controlled assignment by stable vocabulary. | `Essay: Test Automation Strategy` exists in `QA Automation Demo 101`. | Assignment open, submission list | P0 | Designed | Assignment module area and identifier function to be confirmed. |
| Assignments | Confirm assignment grade scale supports planned grade. | Assignment accepts `82 / 100` or equivalent configured scale. | Grading workflow | P0 | Designed | Grade item/scale lookup to be confirmed. |
| Assignments | Confirm assignment visibility for expected roles. | Teacher can access grading entry; student can access assignment view. | Assignment UI, role checks | P0 | Designed | Exact capability checks to be verified. |
| Submissions | Confirm deterministic submission exists. | `student.qa` has submitted work for target assignment. | Teacher opens submissions | P0 | Designed | Submission API area and function name to be confirmed. |
| Submissions | Reset or create deterministic submission where supported. | Setup leaves a known submission ready for grading. | E2E grading setup | P0 | Blocked by environment | Requires write-capable Web Services or documented manual seed fallback. |
| Submissions | Read submission status after UI navigation. | Submission remains visible and not accidentally modified. | UI/API reconciliation | P1 | Designed | Function confirmation needed. |
| Grades/gradebook | Reset target grade before grading scenario. | Student grade is blank or baseline before teacher action. | Grading E2E setup | P0 | Blocked by environment | Mutation helper depends on configured Web Services. |
| Grades/gradebook | Validate grade saved after UI action. | Backend grade for `student.qa` is `82 / 100`. | Teacher grading | P0 | Designed | Grade API or gradebook area to be confirmed. |
| Grades/gradebook | Validate gradebook displays same canonical grade. | Gradebook item for assignment matches saved grade. | Gradebook reconciliation | P0 | Designed | Gradebook data source to be confirmed. |
| Grades/gradebook | Validate student-visible grade state. | Student-facing grade view is consistent with backend state. | Student grade visibility | P0 | Designed | Exact source depends on Moodle grade visibility configuration. |
| Negative access/token checks | Reject invalid or expired token. | Invalid token cannot read controlled course or grades. | API security smoke | P1 | Designed | Error shape and status handling to be verified. |
| Negative access/token checks | Confirm lower-privilege user cannot perform teacher-only helper operation. | Student token cannot read teacher-only grading details or mutate grades. | Role/permission checks | P0 | Designed | Capability and endpoint behavior to be confirmed. |

## UI <-> API Reconciliation Mapping

| UI workflow | API reconciliation target | Related risk |
|---|---|---|
| Teacher dashboard shows controlled course. | Course and enrolment lookup confirms teacher assignment. | R1, R8, R9 |
| Teacher opens assignment. | Assignment lookup confirms module exists in the controlled course. | R2, R9 |
| Teacher sees student submission. | Submission lookup confirms deterministic submission exists for `student.qa`. | R3, R9 |
| Teacher saves grade. | Grade lookup confirms backend grade is `82 / 100`. | R4, R9 |
| Teacher opens gradebook. | Gradebook lookup confirms assignment grade matches gradebook state. | R5, R6, R9 |
| Student sees grade. | Student-visible grade state is consistent with backend grade visibility. | R5, R9 |
| Student blocked from teacher grading. | Capability or negative access check confirms permission boundary. | R7 |

## Negative And Permission Coverage
Planned negative coverage:

- Invalid or expired API token is rejected.
- Student-level user cannot perform teacher-only grading helper responsibilities.
- Optional unenrolled student cannot access restricted course or assignment content.
- UI permission failure should be reconciled with backend role/enrolment state where possible.

Negative tests should fail clearly and must not weaken permission assertions to avoid flakiness.

## Data Setup And Teardown Responsibilities
Phase 3 API helpers should own:

- Preflight validation of controlled Moodle readiness.
- Seed user lookup.
- Course, assignment, submission, and audio resource lookup.
- Grade and submission baseline reset where supported.
- Backend validation after UI workflows.
- Cleanup of temporary data created by tests.
- Environment-blocked reporting when required Web Services are not available.

If mutation APIs are not available at first, document the manual seed baseline and use read-only API reconciliation until Web Services are enabled.

## Phase 3 Implementation Notes
- Do not hardcode Moodle Web Service function names until confirmed.
- Keep API helpers separate from Page Objects.
- Attach important API responses to Allure for failed or high-risk scenarios.
- Prefer API setup over UI setup once the helper is available.
- Keep API status and errors readable for CI diagnostics.
- Preserve Cucumber-first architecture; API helpers support step definitions but do not replace business-readable scenarios.

## Known Unknowns
- Exact Moodle version and enabled Web Service protocols.
- Token model, role scopes, and permitted helper operations.
- Final course, assignment, resource, user IDs, and grade item identifiers.
- Whether assignment submission and grade mutation are available through configured Web Services.
- Whether grade visibility rules require separate student-view validation steps.
- Whether the controlled environment will begin as local Docker or VPS.
