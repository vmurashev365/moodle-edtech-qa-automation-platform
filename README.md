# Moodle EdTech QA Automation Platform

Playwright + TypeScript + Cucumber BDD QA automation platform for Moodle / LMS role-based teacher workflows.

This repository is a documentation-first, portfolio-style QA automation reference demonstrating a senior QA architect approach to testing teacher-centric Moodle workflows. This is a portfolio/training implementation and is not associated with Moodle HQ, Amdaris, or any client production system.

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

## Why this matters for EdTech teams
Teacher workflows (assignment lifecycle, grading, gradebook reconciliation) are directly tied to student outcomes. Detecting regressions early and proving gradebook integrity protects learners and institutional reporting.

## Reusable BDD Lego Steps (business/team value)
New scenarios can be composed from existing approved Lego Steps without changing automation code. Senior QA Architect extends the step library when new domain behavior appears.

This encourages consistent vocabulary across Product, Manual QA and Automation while keeping the automation implementation manageable and reviewable. It does not mean that non-technical users can create automated tests without engineering support—engineering implements and reviews the approved Lego Steps.

## Planned folder structure (phase 2 — design docs only)
```
/ (repo root)
  README.md
  AGENTS.md
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
  features/            (feature files — phase 3)
  src/                 (step implementations, page objects — phase 3)
  .github/workflows/   (GitHub Actions CI — phase 3)
  test-data/           (seed data, fixtures/factories — phase 3)
```

Note: automation folders shown above are planned; this phase creates design documentation only.

---
Last updated: Phase 2 (test design artifacts)
