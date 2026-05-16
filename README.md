# Moodle EdTech QA Automation Platform

Playwright + TypeScript + Cucumber BDD QA automation platform for Moodle / LMS role-based teacher workflows.

This repository is a documentation-first, portfolio-style QA automation reference demonstrating a senior QA architect approach to testing teacher-centric Moodle workflows. This is a portfolio/training implementation and is not associated with Moodle HQ, Amdaris, or any client production system.

## Phase 3 status
Phase 3 adds the first executable automation skeleton: Cucumber, Playwright, TypeScript, tagged feature files, typed support code, UI-MAP/Page Object placeholders, API helper skeletons, Docker compose for a local controlled Moodle stack, and CI validation.

Most Moodle UI workflows are still tagged `@wip` until selectors and Moodle Web Services are verified against the controlled instance. The skeleton does not claim that full E2E/API/UI coverage is implemented yet.

## Planned technology stack
- Playwright
- TypeScript
- Cucumber BDD
- Allure (reporting)
- GitHub Actions (CI)
- Docker / local or VPS Moodle (controlled test host)

## Controlled Moodle instance approach
Tests are intended to run against a controlled Moodle instance (local Docker or dedicated VPS) seeded with deterministic test data to ensure repeatability and traceability. Mount Orange Moodle demo is recon-only and must not be used as the CI target.

## Planned user roles
- teacher
- student
- manager/admin

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
```

Prepare local environment variables:

```bash
cp .env.example .env
```

Start or stop the local controlled Moodle stack:

```bash
npm run docker:start
npm run docker:stop
npm run docker:reset
```

Validate the skeleton:

```bash
npm run type-check
npm run verify:env
npm run test:api
```

Run pending WIP scenarios intentionally:

```bash
npm run test:wip
```

`@wip` scenarios are expected to fail with explicit pending implementation messages until Moodle selectors and API functions are confirmed.

## Why this matters for EdTech teams
Teacher workflows (assignment lifecycle, grading, gradebook reconciliation) are directly tied to student outcomes. Detecting regressions early and proving gradebook integrity protects learners and institutional reporting.

## Reusable BDD Lego Steps (business/team value)
New scenarios can be composed from existing approved Lego Steps without changing automation code. Senior QA Architect extends the step library when new domain behavior appears.

This encourages consistent vocabulary across Product, Manual QA and Automation while keeping the automation implementation manageable and reviewable. It does not mean that non-technical users can create automated tests without engineering support—engineering implements and reviews the approved Lego Steps.

## Planned folder structure (phase 3 skeleton)
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
  .github/workflows/   (GitHub Actions CI — phase 3)
  test-data/           (seed data, fixtures/factories — phase 3)
```

Note: current UI and E2E scenarios are skeleton-level and tagged `@wip` where implementation requires controlled Moodle selector/API verification. Allure report link remains TBD until the first real controlled Moodle run is published.

---
Last updated: Phase 3 (automation skeleton and controlled Moodle setup)
