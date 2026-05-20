# Test Plan — Lightweight Industry-Standard QA Documentation

Document purpose
This is a lightweight test plan inspired by common industry-standard test documentation practices, including ISO/IEC/IEEE 29119-3 style structure. It describes scope, objectives, deliverables, environment, data, risks and responsibilities for the Moodle Teacher QA automation platform.

Test objectives
- Provide repeatable verification of teacher-centered workflows
- Detect regressions affecting grading and gradebook integrity
- Validate role-based access and media playback for learning resources
- Prepare API-backed test data setup and backend validation once Moodle Web Services are verified

Scope
- MVP target covers authentication, teacher dashboard, course access, assignment page, student submission lifecycle, teacher grading, and gradebook validation.
- Current implemented scope covers static framework validation, safe API preflight, Phase 4 local login-page smoke, a Phase 5 manual-seed teacher submission-review workflow, and a Phase 6 grading readiness gate. Phase 5/6 live workflows remain blocked until controlled seed data, URLs/IDs, and grading/gradebook selectors are configured.

Out of scope (MVP)
- Performance/load testing beyond smoke checks
- Full accessibility audit (limited accessibility checks only)
- Large-scale multi-course workflows

Assumptions
- Controlled Moodle environment is available for local runs through Docker or VPS.
- Main GitHub Actions CI remains static/safe and does not require live Moodle.
- Seed data reset through API helpers is planned, not currently available.

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
- Unit (helpers, utilities) — Phase 3+
- Integration (API helpers) — planned Phase 6+
- System / E2E — Phase 4+ local only until controlled CI service is added

Test types
- Functional (UI + API)
- Integration (API ↔ UI state)
- Security / permission checks
- Media / accessibility smoke checks
- Smoke and regression suites

Entry criteria
- Controlled Moodle instance deployed and reachable
- Seed accounts (teacher, student, manager/admin) provisioned
- Manual seed data configured for Phase 5 local teacher workflow
- API-backed test-data reset helpers are a future entry criterion for broader regression

Exit criteria
These are target MVP completion criteria, not current evidence status.

- All critical and high-priority tests pass in the intended controlled execution environment
- No open P0/P1 defects blocking release
- Evidence published to Allure/evidence index once real controlled Moodle runs are ready

Suspension/resumption criteria
- Suspend local Moodle workflow runs if the controlled host is unavailable or manual seed data is missing; resume after remediation and seed verification.

Test deliverables
- Phase 2 test design artifacts: traceability matrix, test data strategy, BDD architecture, API coverage matrix
- Automation source (features + step implementations) — phase 3+
- Allure reports — TBD until published from controlled Moodle runs
- Evidence index updates
- Test plan and strategy documents

Test environment summary
- Controlled Moodle instance (Docker or VPS)
- CI: GitHub Actions hosted runner for static framework validation and safe API preflight only
- Future CI: optional controlled Moodle service job after setup is stable

Test data summary
- Seeded users: teacher, student, manager/admin
- Student display name: `Student QA` or configured `MOODLE_STUDENT_DISPLAY_NAME`
- One course, one assignment, one test submission, one teacher grade

Risks and mitigations
- Public demo instability — Mount Orange remains recon-only; repeatable tests use controlled Moodle.
- Test-data pollution — manual seed checklist now; API reset helpers and scoped datasets are planned.

Roles and responsibilities
- Senior QA Architect: architecture, step-library design, acceptance criteria
- QA engineers: write features, review steps, implement steps with guidance
- Developers: implement API helpers and page objects as needed
- Product Owner: review and approve feature definitions

Schedule / phased delivery
- Phase 1: documentation foundation and evidence index
- Phase 2: test design artifacts: traceability, test data strategy, BDD architecture, API coverage matrix
- Phase 3: automation skeleton and controlled Moodle setup: package/config, Cucumber/Playwright structure, feature files, page objects, API helper skeleton, CI skeleton
- Phase 4: local controlled Moodle login-page smoke
- Phase 5: manual-seed teacher submission-review workflow; blocked until controlled seed data and URLs/IDs are configured
- Phase 6: grading/gradebook readiness gate and WIP target scenario; full proof remains blocked until seed/selectors are verified
- Later: API-backed seeding/reset, security/media checks, and published evidence

Approval / completion criteria
- Stakeholder sign-off on MVP test scope and target evidence model
- Static CI green in GitHub Actions
- Public Allure report and demo video remain TBD until controlled Moodle workflow evidence is published

MVP controlled data (explicit)
- teacher user
- student user
- manager/admin user
- one course
- one assignment
- one test submission
- one teacher grade

Important note: Public Moodle demos are useful for discovery, but stable automated tests must use the controlled Moodle environment.
