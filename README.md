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

Data setup now uses the Phase 6A.1 local seed command below. Grading and gradebook reconciliation remain Phase 6 scope until selector discovery and grade save behavior are verified.

## Phase 6A.1 controlled seed status

Phase 6A.1 adds a deterministic local Moodle seed command:

- runs inside the local Docker Moodle container
- uses Moodle internal APIs for users, course creation, manual enrolment, assignment creation/update, and online text submission setup
- creates or updates `teacher.qa`, `student.qa`, `QA Automation Demo 101`, `Essay: Test Automation Strategy`, enrolments, and the deterministic student submission
- writes generated course, assignment, student, submission, submissions, and gradebook IDs/URLs to a local seed artifact
- applies generated IDs and URLs to the untracked local `.env` with `npm run moodle:seed:env`
- writes ignored local metadata to `artifacts/seed/controlled-data.generated.json`

`npm run moodle:seed:env` creates `.env` from `.env.example` if needed and creates a timestamped `.env.backup.*` before editing an existing `.env`. Generated URLs use Moodle's configured local `wwwroot` so browser sessions stay on the host Moodle expects. The seed artifact is local setup evidence only. It is not public proof by itself. Recorder/Codegen selector discovery and grading selector implementation come after seed readiness passes.

## Current Status

Implemented:

- static GitHub Actions validation
- controlled Moodle login-page smoke
- Phase 5 submission-review foundation with controlled seed readiness checks
- Phase 6A.1 local controlled Moodle seed and safe `.env` sync commands
- Playwright Trace Viewer zip capture for failed Cucumber browser scenarios when `TRACE_MODE=retain-on-failure`

Blocked / WIP:

- Phase 6 grading and gradebook flow until submissions navigation, gradebook navigation, and grading selectors are verified
- next immediate step: Recorder/Codegen selector discovery against the seeded local Moodle instance

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
npm run moodle:stop
```

Convenience readiness path:

```bash
npm run moodle:start
npm run moodle:wait
npm run moodle:seed:ready
npm run test:local:teacher-workflow
npm run moodle:stop
```

`check:local:grading-readiness` validates only the local grading data contract. `test:local:grading` is guarded against selecting zero scenarios, so while the Phase 6 scenario remains `@wip` it fails intentionally instead of producing false evidence.

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

Failed Cucumber browser scenarios save Playwright traces under ignored `traces/` by default (`TRACE_MODE=retain-on-failure`) and attach the trace zip to the Cucumber/Allure result where reporter plumbing supports attachments. Use `TRACE_MODE=off` to disable traces or `TRACE_MODE=on`/`all` to retain traces for passing scenarios too.

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

Note: current UI and E2E workflows beyond the Phase 5 submission-review path are skeleton-level and tagged `@wip` where implementation requires controlled Moodle selector/API verification. Allure report link remains TBD until a controlled Moodle run is published. The Docker image defaults remain configurable; pinning the Moodle image is deferred until the seeded local workflow is proven against a specific version.

---

Last updated: Phase 7 reliability and evidence-honesty hardening
