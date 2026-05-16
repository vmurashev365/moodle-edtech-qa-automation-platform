# Test Plan — Lightweight Industry-Standard QA Documentation

Document purpose
This is a lightweight test plan inspired by common industry-standard test documentation practices, including ISO/IEC/IEEE 29119-3 style structure. It describes scope, objectives, deliverables, environment, data, risks and responsibilities for Phase 1 (MVP) of the Moodle Teacher QA automation platform.

Test objectives
- Provide repeatable verification of teacher-centered workflows
- Detect regressions affecting grading and gradebook integrity
- Validate role-based access and media playback for learning resources
- Provide API-backed test data setup and backend validation

Scope
- MVP covers authentication, teacher dashboard, course access, assignment page, student submission lifecycle, teacher grading, and gradebook validation.

Out of scope (MVP)
- Performance/load testing beyond smoke checks
- Full accessibility audit (limited accessibility checks only)
- Large-scale multi-course workflows

Assumptions
- Controlled Moodle environment will be available for CI and local runs
- Seed data can be reset between runs via API helpers

Test items
- Moodle authentication
- Teacher dashboard
- Course access
- Assignment lifecycle
- Student submission lifecycle
- Teacher grading
- Gradebook reconciliation
- Media/audio resource rendering and controls
- API-backed setup and validation

Features to be tested
- Login/role access
- Assignment visibility and lifecycle
- Submission visibility to teacher
- Grade save/persist behavior
- Gradebook aggregates and display
- Audio/video resource load and playback controls

Features not to be tested in MVP
- Full LMS integration tests with external LTI providers
- Performance beyond basic smoke checks

Test levels
- Unit (helpers, utilities) — Phase 2
- Integration (API helpers) — Phase 2
- System / E2E — Phase 2/3

Test types
- Functional (UI + API)
- Integration (API ↔ UI state)
- Security / permission checks
- Media / accessibility smoke checks
- Smoke and regression suites

Entry criteria
- Controlled Moodle instance deployed and reachable
- Seed accounts (teacher, student, manager/admin) provisioned
- Test-data reset helpers available

Exit criteria
- All critical and high-priority tests pass in CI
- No open P0/P1 defects blocking release
- All test evidence published to Allure and evidence index

Suspension/resumption criteria
- Suspend runs if controlled host is unavailable > 30 minutes; resume after remediation and test-data reset.

Test deliverables
- Automation source (features + step implementations) — phase 2
- Allure reports from CI runs
- Evidence index updates
- Test plan and strategy documents

Test environment summary
- Controlled Moodle instance (Docker or VPS)
- CI: GitHub Actions (self-hosted or hosted runners) with access to controlled host

Test data summary
- Seeded users: teacher, student, manager/admin
- One course, one assignment, one test submission, one teacher grade

Risks and mitigations
- Public demo instability — use controlled Moodle for CI
- Test-data pollution — API reset helpers and scoped datasets

Roles and responsibilities
- Senior QA Architect: architecture, step-library design, acceptance criteria
- QA engineers: write features, review steps, implement steps with guidance
- Developers: implement API helpers and page objects as needed
- Product Owner: review and approve feature definitions

Schedule / phased delivery
- Phase 1: documentation and evidence index (this deliverable)
- Phase 2: skeleton automation (features, step-library, API helpers)
- Phase 3: implement E2E, CI, Allure evidence and demo video

Approval / completion criteria
- Stakeholder sign-off on MVP test scope and evidence readiness
- CI run producing Allure report marked as Ready

MVP controlled data (explicit)
- teacher user
- student user
- manager/admin user
- one course
- one assignment
- one test submission
- one teacher grade

Important note: Public Moodle demos are useful for discovery, but stable automated tests must use the controlled Moodle environment.
