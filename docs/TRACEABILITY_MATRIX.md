# Traceability Matrix

## Document Purpose

This document maps Moodle / EdTech business requirements, known risks, and planned automated coverage for Phase 2 test design. It turns the Phase 1 overview, risk analysis, test plan, and strategy into implementation-ready scope for Phase 3.

The matrix is intentionally lightweight. It is a planning artifact for automation design, review, and evidence traceability, not a claim that the automation already exists.

## Scope

Phase 2 traceability covers the MVP Moodle teacher workflow:

- Authentication and role-aware access.
- Teacher dashboard and assigned course access.
- Assignment visibility, submission review, grading, and gradebook reconciliation.
- Student-visible grade validation.
- API-backed setup, teardown, and backend validation.
- One media/audio smoke check.
- Controlled Moodle execution readiness.

Mount Orange Moodle demo remains recon-only and is not a CI target.

## Requirement And Risk Identifiers

Requirement IDs use the following pattern:

- `REQ-AUTH-*` for authentication and session readiness.
- `REQ-DASH-*` for teacher dashboard and reporting visibility.
- `REQ-COURSE-*` for course access.
- `REQ-ASSIGN-*` for assignment access.
- `REQ-SUBMIT-*` for student submission visibility.
- `REQ-GRADE-*` for teacher grading.
- `REQ-GRADEBOOK-*` for gradebook reconciliation.
- `REQ-ROLE-*` for role and permission boundaries.
- `REQ-MEDIA-*` for media/audio learning resources.
- `REQ-API-*` for API helper and backend validation coverage.
- `REQ-DATA-*` for deterministic data lifecycle.

Risk IDs are inherited from [RISK_ANALYSIS.md](RISK_ANALYSIS.md), where possible:

- `R1` teacher cannot access assigned course.
- `R2` assignment not visible or opens incorrectly.
- `R3` student submission not visible to teacher.
- `R4` teacher grade not saved.
- `R5` student sees wrong grade.
- `R6` gradebook mismatch.
- `R7` student can access teacher-only grading page.
- `R8` dashboard/reporting count incorrect.
- `R9` API and UI state drift.
- `R10` audio/media learning resource issue.
- `R11` public demo instability.
- `R12` test data pollution.

Automation status values:

- Planned
- Designed
- Ready for implementation
- Blocked by environment
- Future expansion
- Ready for local validation
- Implemented locally

## Traceability Table

| ID                | Requirement / business contract                                                               | Related risk ID(s)             | Planned test scenario                                                                                                                                                                           | Test layer                                            | Priority | Automation status          | Evidence target                                |
| ----------------- | --------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------- | -------------------------- | ---------------------------------------------- |
| REQ-AUTH-000      | Controlled Moodle login page is reachable before deeper workflow execution.                   | R11                            | Open the local controlled Moodle login page and verify the login form is visible.                                                                                                               | Local smoke, UI check                                 | P0       | Implemented locally        | Allure test case, screenshot on failure        |
| REQ-AUTH-001      | Teacher can authenticate and reach the Moodle start state for assigned work.                  | R1, R9                         | Teacher logs in with configured controlled credentials before opening assigned work.                                                                                                            | UI check, API precheck                                | P0       | Ready for local validation | Allure test case, screenshot on failure        |
| REQ-DASH-001      | Teacher dashboard shows the assigned course and actionable learning work.                     | R1, R8, R9                     | Teacher dashboard lists `QA Automation Demo 101` and links to active course work.                                                                                                               | UI check, API reconciliation                          | P1       | Designed                   | Allure test case, API response attachment      |
| REQ-COURSE-001    | Teacher can open the assigned course from configured controlled navigation.                   | R1                             | Teacher opens `QA Automation Demo 101` using controlled course ID or URL and sees the course context.                                                                                           | UI check, API check                                   | P0       | Ready for local validation | Allure test case, trace/video on failure       |
| REQ-ASSIGN-001    | Teacher can open the target assignment and review the assignment workflow entry point.        | R2                             | Teacher opens `Essay: Test Automation Strategy` from configured URL/ID or visible course link.                                                                                                  | UI check, API check                                   | P0       | Ready for local validation | Allure test case, screenshot on failure        |
| REQ-SUBMIT-001    | Teacher can see the deterministic student submission for the assignment.                      | R3, R9, R12                    | Teacher clicks Dashboard → My courses → course → assignment → `Grade` and sees Student QA's submitted, not graded work in the grading interface after local seed.                               | E2E workflow, UI validation                           | P0       | Implemented locally        | Local Cucumber/Allure result, trace on failure |
| REQ-GRADE-001     | Teacher grade entry is saved and persists after navigation or refresh.                        | R4, R9                         | Teacher grades the deterministic submission as `82 / 100` and the saved grade persists.                                                                                                         | E2E workflow, UI validation, Moodle CLI backend check | P0       | Implemented locally        | Local Cucumber/Allure result, trace on failure |
| REQ-GRADEBOOK-001 | Gradebook displays the same grade produced by the assignment grading workflow.                | R5, R6, R9                     | Gradebook shows `82 / 100` for `Student QA` in `QA Automation Demo 101`.                                                                                                                        | E2E workflow, UI validation, Moodle CLI backend check | P0       | Implemented locally        | Local Cucumber/Allure result, trace on failure |
| REQ-ROLE-001      | Student cannot access teacher-only grading pages or actions.                                  | R7                             | Signed-in Student QA opens the single-user grading URL and gets Moodle's `error/nopermission` page (HTTP 404) while still signed in; no grade input or Save changes. A redirect to login fails. | Security/permission check                             | P0       | Implemented locally        | Local Cucumber/Allure result, trace on failure |
| REQ-ROLE-002      | Optional unenrolled student cannot access restricted course or assignment content.            | R1, R7                         | `outsider.student.qa` attempts restricted course/assignment access and is denied.                                                                                                               | Security/permission check                             | P1       | Future expansion           | Allure test case, manual exploratory note      |
| REQ-MEDIA-001     | Audio learning resource renders and exposes expected controls for the learner.                | R10                            | Student opens `Sample Listening Task` and audio controls are visible.                                                                                                                           | Media/audio smoke, UI check                           | P1       | Designed                   | Allure test case, screenshot on failure        |
| REQ-API-001       | API helpers can authenticate, inspect site readiness, and validate core Moodle state.         | R9, R11                        | API preflight confirms controlled Moodle is reachable and test users/course exist.                                                                                                              | API checks                                            | P0       | Designed                   | CI artifact, API response attachment           |
| REQ-API-002       | API helpers validate users, roles, course enrolment, assignment, submission, and grade state. | R1, R2, R3, R4, R5, R6, R7, R9 | Backend checks confirm the UI workflow state before and after E2E execution.                                                                                                                    | API checks                                            | P0       | Designed                   | Allure API attachments, CI artifact            |
| REQ-DATA-001      | Test data is deterministic, isolated, and resettable between runs.                            | R11, R12                       | Local seed creates/reconciles controlled Moodle data; the `@ungraded-baseline` Before hook resets the Student QA grade before each grade-dependent scenario.                                    | Local seed, readiness checks                          | P0       | Implemented locally        | Local readiness log, recorder note             |

## Coverage Summary

Planned Phase 2 design coverage:

- 2 E2E workflows:
  - Teacher assignment grading to gradebook reconciliation.
  - Student/teacher role workflow validating student-visible grade and permission boundary.
- 6 focused UI checks:
  - Teacher login.
  - Teacher dashboard course visibility.
  - Course page opens.
  - Assignment page opens.
  - Submission list opens.
  - Gradebook displays expected student/grade.
- 15-20 target API checks:
  - Auth/site info, users/roles, courses, enrolments, assignments, submissions, grades/gradebook, and negative token/access checks.
- 1-2 security/permission checks:
  - Student cannot access teacher-only grading.
  - Optional unenrolled student cannot access restricted course content.
- 1 media/audio smoke check:
  - Audio resource availability and visible controls.

## Phase Mapping

| Phase   | Traceability expectation                                                                                                                                                                     | Status                                                                                |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Phase 1 | Define business scope, risk model, test plan, and methodology transfer.                                                                                                                      | Complete                                                                              |
| Phase 2 | Design traceability, data strategy, BDD architecture, and API coverage.                                                                                                                      | This document                                                                         |
| Phase 3 | Create Cucumber/Playwright/TypeScript skeleton, controlled Moodle setup contract, feature files, page object placeholders, API helper skeleton, CI validation, and local execution commands. | Skeleton created; implementation pending                                              |
| Phase 4 | Implement the first controlled Moodle readiness/login smoke and document local execution.                                                                                                    | Implemented locally; public evidence TBD                                              |
| Phase 5 | Add manual-seed data readiness and first teacher submission-review workflow.                                                                                                                 | Ready for local validation; pass depends on seeded Moodle data                        |
| Phase 6 | Add grading/gradebook readiness gate and target scenario for teacher grade save and gradebook validation.                                                                                    | Implemented locally with Mission 6 selector evidence and guarded `test:local:grading` |
| Phase 7 | Add the student role-negative check against teacher-only grading.                                                                                                                            | Implemented locally with guarded `test:local:security`                                |

## Known Gaps / Future Expansion

- Phase 6 reconciles the stored assignment and gradebook grade through a read-only Moodle CLI script. Exact Moodle Web Service functions must be confirmed before claiming API-level grade reconciliation.
- Final course, assignment, resource, and user identifiers may change by environment, but scenario vocabulary should remain stable.
- Mount Orange recorder notes may support exploratory learning, but they must not become CI evidence.
- Accessibility checks are limited to smoke-level observations until a dedicated accessibility pass is planned.
- Teacher-only pages other than the single-user grading interface (the submissions table `action=grading` and the gradebook grader report) have no role-negative check yet.
- Moodle Web Service-backed grading/gradebook reconciliation, media validation, multi-course, group-mode, rubric, file-upload edge cases, and notifications remain future expansion unless promoted by risk.
