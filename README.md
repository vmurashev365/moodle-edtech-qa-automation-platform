# Moodle EdTech QA Automation Platform

Playwright + TypeScript + Cucumber BDD QA automation platform for Moodle / LMS role-based teacher workflows.

This repository is a documentation-first, portfolio-style QA automation reference demonstrating a senior QA architect approach to testing teacher-centric Moodle workflows. This is a portfolio/training implementation and is not associated with Moodle HQ, Amdaris, or any client production system.

## Phase 3 status

Phase 3 adds the first executable automation skeleton: Cucumber, Playwright, TypeScript, tagged feature files, typed support code, UI-MAP/Page Object placeholders, API helper skeletons, Docker compose for a local controlled Moodle stack, and CI validation.

Most Moodle UI workflows are still tagged `@wip` until selectors and Moodle Web Services are verified against the controlled instance. The skeleton does not claim that full E2E/API/UI coverage is implemented yet.

## Phase 4 local smoke status

Phase 4 adds the first real local controlled-Moodle smoke path:

- start Moodle with Docker Compose
- wait until the local Moodle URL is reachable
- open the controlled Moodle login page
- assert the login form is visible

Teacher/student users, course, assignment, submission, and grade still require controlled seed data before deeper workflows can pass.

## Phase 5 teacher workflow status

Phase 5 adds the first teacher-facing local workflow path:

- verify the controlled Moodle instance is reachable
- verify the local Phase 5 data contract is configured
- log in as the configured teacher
- open the controlled course
- open the controlled assignment
- open the submissions view
- assert the deterministic student submission is visible

Data setup now uses the local seed command below. Phase 6 adds the first real grading and gradebook reconciliation path for the same controlled assignment.

## Phase 6A.1 controlled seed status

The deterministic local Moodle seed command:

- runs inside the local Docker Moodle container
- uses Moodle internal APIs for users, course creation, manual enrolment, assignment creation/update, and online text submission setup
- creates or updates `teacher.qa`, `student.qa`, `QA Automation Demo 101`, `Essay: Test Automation Strategy`, enrolments, and the deterministic student submission
- resets the Student QA assignment grade to Moodle's ungraded baseline through the assign grading API before the UI grading scenario writes the target grade
- writes generated course, assignment, student, submission, submissions, and gradebook IDs/URLs to a local seed artifact
- applies generated IDs and URLs to the untracked local `.env` with `npm run moodle:seed:env`
- writes ignored local metadata to `artifacts/seed/controlled-data.generated.json`

`npm run moodle:seed:env` creates `.env` from `.env.example` if needed and creates a timestamped `.env.backup.*` before editing an existing `.env`. Generated URLs use Moodle's configured local `wwwroot` so browser sessions stay on the host Moodle expects. The seed artifact is local setup evidence only. It is not public proof by itself.

## Phase 6 grading and gradebook status

Phase 6 implements one deterministic local UI scenario:

- log in as `teacher.qa`
- open the generated single-user grading URL for Student QA
- enter `MOODLE_TARGET_GRADE`, default `82`
- save through Moodle's grading UI
- open the gradebook and verify the `#fixed_user_<MOODLE_STUDENT_ID>` row contains `Student QA`, `student.qa@example.test`, and `82.00`

Mission 6 Recorder/Codegen evidence was captured locally under ignored `tools/recordings/localhost_mission6`. The implemented scenario is evidence only when `npm run moodle:seed:ready` followed by `npm run test:local:grading` passes. API coverage remains preflight/helper-level until Moodle Web Services are configured.

## Current Status

Implemented:

- static GitHub Actions validation
- controlled Moodle login-page smoke
- Phase 5 submission-review foundation with controlled seed readiness checks
- local controlled Moodle seed and safe `.env` sync commands
- Phase 6 local teacher grading plus gradebook row verification
- demo and fast execution profiles for local review and CI-safe runs
- Playwright Trace Viewer zip capture for failed Cucumber browser scenarios when `MOODLE_TRACE_MODE=retain-on-failure`

Blocked / WIP:

- broader API-backed grade reset/reconciliation through Moodle Web Services
- security, media, and role-negative workflows beyond existing skeleton coverage

Planned:

- API-backed reset and backend validation
- role negative test
- audio/media test
- public Allure report and demo video

## Planned technology stack

- Playwright
- TypeScript
- Cucumber BDD
- Allure (reporting)
- GitHub Actions (CI)
- Docker / local or VPS Moodle (controlled test host)

## Controlled Moodle instance approach

Tests are intended to run against a controlled Moodle instance (local Docker or dedicated VPS) seeded with deterministic test data to ensure repeatability and traceability. Mount Orange Moodle demo is recon-only and must not be used as the CI target.

The local Docker Compose file uses configurable Moodle and database image variables. The default images are intended for local portfolio validation only; pin or mirror approved images before treating the stack as long-lived infrastructure.

## Planned user roles

- teacher and student are created or refreshed by the local seed
- built-in admin comes from the Moodle image and is used for local setup
- manager is planned for later role/security expansion, not currently seeded

## Planned controlled data (MVP)

- one course
- one assignment
- one student submission
- one teacher grade

## Planned test layers

- E2E
- UI
- API
- security / role-based access
- media / audio
- smoke
- regression

## Links (docs)

- [docs/EVIDENCE_INDEX.md](docs/EVIDENCE_INDEX.md)
- [docs/CLIENT_OVERVIEW.md](docs/CLIENT_OVERVIEW.md)
- [docs/TEST_PLAN.md](docs/TEST_PLAN.md)
- [docs/TEST_STRATEGY.md](docs/TEST_STRATEGY.md)
- [docs/RISK_ANALYSIS.md](docs/RISK_ANALYSIS.md)
- [docs/METHODOLOGY_TRANSFER.md](docs/METHODOLOGY_TRANSFER.md)
- [docs/TRACEABILITY_MATRIX.md](docs/TRACEABILITY_MATRIX.md)
- [docs/TEST_DATA_STRATEGY.md](docs/TEST_DATA_STRATEGY.md)
- [docs/BDD_ARCHITECTURE.md](docs/BDD_ARCHITECTURE.md)
- [docs/API_COVERAGE_MATRIX.md](docs/API_COVERAGE_MATRIX.md)
- [docs/TEST_EXECUTION_PROCEDURE.md](docs/TEST_EXECUTION_PROCEDURE.md)

## Local setup and commands

Use Node.js `24.x` for local development and CI.

Install dependencies:

```bash
npm install
npm run install:browsers
```

Prepare local environment variables:

```bash
cp .env.example .env
```

Start or stop the local controlled Moodle stack:

```bash
npm run moodle:start
npm run moodle:wait
npm run moodle:seed
npm run moodle:seed:env
npm run check:data
npm run check:grading-data
npm run check:local:grading-readiness
npm run test:local:teacher-workflow
npm run test:local:grading
npm run moodle:stop
```

Convenience readiness path:

```bash
npm run moodle:start
npm run moodle:wait
npm run moodle:seed:ready
npm run test:local:teacher-workflow
npm run test:local:grading
npm run moodle:stop
```

`check:local:grading-readiness` validates only the local grading data contract. `test:local:grading` is local-only and guarded against selecting zero scenarios.

## Demo and fast execution profiles

This repository uses two execution profiles:

- `demo`: headed browser, readable scenario/step terminal output, small review delays, and optional screencast/video with click feedback.
- `fast`: headless, no artificial delays, CI/CD-friendly, and safe for GitHub Actions-style validation.

The profile is called `demo`, not production, because this framework targets a local controlled Moodle demo instance rather than a protected production or WAF-backed application.

Local demo review commands:

```bash
npm run moodle:start
npm run moodle:wait
npm run moodle:seed:ready
npm run test:demo:smoke
npm run test:demo:teacher-workflow
npm run test:demo:grading
npm run test:demo:screencast:grading
```

Fast checks:

```bash
npm run type-check
npm run lint
npm run format:check
npm run verify:env
npm run test:fast:api
```

Demo videos are written under ignored `videos/`, traces under ignored `traces/`, screenshots under ignored `screenshots/`, and local reports under ignored `reports/`.
Teacher-workflow and grading demo/fast scripts run the seed readiness path before the scenario so they stay repeatable after a previous grading run.
The demo screencast grading command records Playwright video with click target highlighting, regenerates the Allure HTML evidence package, and opens the local Allure viewer automatically after the Cucumber run. Set `ALLURE_AUTO_OPEN=false` to generate the report without launching the viewer.

Generate an Allure HTML evidence package while preserving the test exit code:

```bash
npm run test:demo:grading:report
npm run test:demo:screencast:grading
npm run test:fast:api:report
```

The generated report is written to ignored `reports/allure-report/`; raw Allure results live under ignored `reports/allure-results/`.

Validate the skeleton:

```bash
npm run type-check
npm run lint
npm run format:check
npm run verify:env
npm run test:api
```

Run pending WIP scenarios intentionally:

```bash
npm run test:wip
```

`@wip` scenarios are expected to fail with explicit pending implementation messages until Moodle selectors and API functions are confirmed.

GitHub Actions currently validates the framework skeleton, type safety, lint/type validation, environment contract, and safe API preflight only. It does not start Moodle or depend on a public demo instance.

The separate **Manual Moodle Test Run** workflow can be launched from the GitHub Actions UI or mobile app. It supports `fast-api`, `local-smoke`, `local-teacher-workflow`, `local-grading`, and `local-grading-screencast`, uploads the Allure/Cucumber evidence artifacts, and can send a short stakeholder email digest when SMTP secrets are configured.

Failed Cucumber browser scenarios save Playwright traces under ignored `traces/` by default (`MOODLE_TRACE_MODE=retain-on-failure`) and attach the trace zip to the Cucumber/Allure result where reporter plumbing supports attachments. Use `MOODLE_TRACE_MODE=off` to disable traces or `MOODLE_TRACE_MODE=on`/`all` to retain traces for passing scenarios too.

Prepare a clean review archive from Git history rather than local generated artifacts:

```bash
npm run clean:local
git status --short
git archive --format=zip --output ../moodle-edtech-qa-automation-platform-clean.zip HEAD
```

## Why this matters for EdTech teams

Teacher workflows (assignment lifecycle, grading, gradebook reconciliation) are directly tied to student outcomes. Detecting regressions early and proving gradebook integrity protects learners and institutional reporting.

## Reusable BDD Lego Steps (business/team value)

New scenarios can be composed from existing approved Lego Steps without changing automation code. Senior QA Architect extends the step library when new domain behavior appears.

This encourages consistent vocabulary across Product, Manual QA and Automation while keeping the automation implementation manageable and reviewable. It does not mean that non-technical users can create automated tests without engineering support—engineering implements and reviews the approved Lego Steps.

## Current folder structure

```
/ (repo root)
  README.md
  AGENTS.md
  package.json
  cucumber.js
  playwright.config.ts
  docker-compose.yml
  docs/
    EVIDENCE_INDEX.md
    CLIENT_OVERVIEW.md
    TEST_PLAN.md
    TEST_STRATEGY.md
    RISK_ANALYSIS.md
    METHODOLOGY_TRANSFER.md
    TRACEABILITY_MATRIX.md
    TEST_DATA_STRATEGY.md
    BDD_ARCHITECTURE.md
    API_COVERAGE_MATRIX.md
    TEST_EXECUTION_PROCEDURE.md
  features/            (feature files — phase 3)
  src/                 (step implementations, page objects — phase 3)
  .github/workflows/   (static framework CI)
  test-data/           (seed data, fixtures/factories — phase 3)
```

Note: UI and E2E workflows beyond the Phase 4 smoke, Phase 5 teacher submission review, and Phase 6 local grading/gradebook scenario remain skeleton-level and tagged `@wip` where implementation requires controlled Moodle selector/API verification. Allure report link remains TBD until a controlled Moodle run is published. The Docker image defaults remain configurable; pinning the Moodle image is deferred until the seeded local workflow is proven against a specific version.

---

Last updated: Phase 8 demo/fast execution profiles and local grading evidence
