# Evidence Index

Purpose: a concise navigation page for reviewers to find key evidence and artifacts. Links marked as TBD are placeholders until implementation evidence is produced.

## Main repository

- GitHub repository: https://github.com/vmurashev365/moodle-edtech-qa-automation-platform

## Live reports

- Allure report: TBD
- Local Allure report: can be generated from local runs with `npm run report:allure`; ignored locally and not published
- GitHub Actions run: Available in repository Actions tab
- CI artifact: framework-validation-reports

## Demo video

- 3–5 minute walkthrough: TBD

## Moodle evidence

- Controlled Moodle setup: Docker Compose available; `npm run moodle:seed` creates deterministic local users/course/assignment/enrolments/submission; `npm run moodle:seed:env` applies generated metadata to untracked local `.env`; generated local artifact is ignored and not public proof by itself
- Phase 4 local controlled Moodle smoke: implemented and passed locally; public report/screenshot link TBD
- Phase 5 local teacher submission review: implemented for controlled seeded Moodle; run `npm run moodle:seed:ready` or run seed plus `.env` sync before the workflow; public report/screenshot link TBD
- Failed Cucumber browser scenarios: Playwright trace zip is saved under ignored `traces/` when `TRACE_MODE=retain-on-failure` or `on`
- Mount Orange recorder findings: planned only for recon, not CI
- Full teacher assignment grading E2E: Phase 6 WIP/blocked until grading and gradebook selectors are verified
- First API coverage beyond safe preflight: TBD

## Phase 3 automation skeleton

- Cucumber + TypeScript skeleton: Ready locally after dependency install
- Playwright browser engine inside Cucumber steps: Skeleton ready
- Docker compose controlled Moodle stack: Ready for local setup; Moodle admin/Web Services configuration still TBD
- Safe API preflight scenario: Ready for environment-contract validation
- WIP UI/E2E/security/media scenarios: Pending selector and Web Service verification
- GitHub Actions skeleton validation: Ready; see Live reports entry

## Phase 4 local smoke

- Controlled Moodle wait script: Ready
- Local login page smoke: Passed locally with `npm run test:local:smoke`
- Teacher/student/course/assignment provisioning: deterministic local seed available with `npm run moodle:seed`; `.env` synchronization available with `npm run moodle:seed:env`

## Phase 5 local teacher workflow

- Controlled data readiness check: Ready with `npm run check:data`
- Teacher submission-review workflow: Implemented with `npm run test:local:teacher-workflow`; requires seeded local Moodle data and generated `.env` URLs
- Seed evidence and public Allure report: TBD
- Grading and gradebook reconciliation: Phase 6

## Phase 6 grading / gradebook workflow

- Grading readiness check: Ready with `npm run check:grading-data`
- Local grading readiness alias: Ready with `npm run check:local:grading-readiness`
- Local grading command: `npm run test:local:grading` is guarded against zero-scenario false green results
- Current status: Seed data can be created locally; grading scenario remains `@wip` pending selector verification and is not proven evidence
- Next step: Recorder/Codegen selector discovery against the seeded local Moodle instance
- Public Allure report/demo evidence: TBD

## Phase 2 design artifacts

- [Traceability Matrix](TRACEABILITY_MATRIX.md): Ready
- [Test Data Strategy](TEST_DATA_STRATEGY.md): Ready
- [BDD Architecture](BDD_ARCHITECTURE.md): Ready
- [API Coverage Matrix](API_COVERAGE_MATRIX.md): Ready

These artifacts define planned coverage only. Allure public report, demo video, recorder findings, full teacher workflow E2E, and implemented Moodle API coverage beyond safe preflight remain TBD until later implementation produces evidence.

## Related portfolio implementations

- Hora Services Logistics QA Platform: https://github.com/vmurashev365/logistics-qa-automation-platform

## What to review first

1. [README.md](../README.md)
2. [docs/CLIENT_OVERVIEW.md](CLIENT_OVERVIEW.md)
3. [docs/EVIDENCE_INDEX.md](EVIDENCE_INDEX.md)
4. [docs/METHODOLOGY_TRANSFER.md](METHODOLOGY_TRANSFER.md)
5. [docs/TEST_PLAN.md](TEST_PLAN.md)
6. [docs/TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)
7. [docs/TEST_DATA_STRATEGY.md](TEST_DATA_STRATEGY.md)
8. [docs/BDD_ARCHITECTURE.md](BDD_ARCHITECTURE.md)
9. [docs/API_COVERAGE_MATRIX.md](API_COVERAGE_MATRIX.md)
10. [docs/TEST_EXECUTION_PROCEDURE.md](TEST_EXECUTION_PROCEDURE.md)

## Status legend

- Ready
- In progress
- Planned
- Placeholder

Notes: Links marked "TBD" are honest placeholders until evidence is produced and published. Do not use placeholders as evidence.
