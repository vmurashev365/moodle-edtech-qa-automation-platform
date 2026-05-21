# Client Overview

Purpose: explain what this framework is and why it exists in plain language suitable for hiring managers, QA leads, and engineering reviewers.

## What this framework is

A documentation-first, BDD-driven QA automation platform for teacher workflows in Moodle. It focuses on role-based flows, assignment lifecycle, grading, and gradebook reconciliation.

## Why it was created

To demonstrate a repeatable, risk-focused QA automation approach for EdTech platforms that balances automation with manual testing and produces traceable evidence for reviewers.

## Business risks this protects against

- Teacher cannot see submitted work
- Student sees wrong grade
- Gradebook does not match teacher action
- Dashboard/reporting status is incorrect
- Student accesses teacher-only grading workflow
- Assignment lifecycle fails after product changes
- Audio/media learning resource unavailable or controls broken

## Workflows covered or planned

- Phase 4 local smoke: controlled Moodle login page reachability.
- Phase 5 local workflow: teacher submission review against seeded controlled data.
- Phase 6 local workflow: teacher grading and gradebook row validation against seeded controlled data.
- Planned next coverage: role-based access, selected media/audio resource checks, and Web Service-backed backend validation.

## User roles covered

- teacher
- student
- manager/admin

## Test types included

- E2E, UI, API, security/permission checks, media/audio checks, smoke and regression suites.

## How automation supports manual QA

Automation provides repeatable regression coverage and fast feedback for business-critical flows. Manual QA focuses on exploratory testing, human-centric edge cases, and accessibility contexts that are not yet automated.

## How reports and evidence are produced

- Static CI evidence is produced through GitHub Actions artifacts.
- Local controlled Moodle smoke, Phase 5 teacher workflow, and Phase 6 grading workflow results are local evidence until published.
- Public Allure report and demo video remain TBD.
- [EVIDENCE_INDEX.md](EVIDENCE_INDEX.md) is the source of truth for available artifacts and placeholders.

## Controlled environment approach

Public Moodle demos are useful for discovery and exploratory recon only. Stable automated tests are intended to run against a controlled Moodle instance (local Docker or VPS) with deterministic seed data. The local seed resets the controlled grading baseline through Moodle internal APIs; broader Web Service-backed helpers are planned after Moodle Web Services are verified.

## Reusable BDD Lego Steps as team multiplier

New scenarios can be composed from existing approved Lego Steps without changing automation code. Senior QA Architect extends the step library when new domain behavior appears.

This enables Product Owners, Manual QA, and Junior engineers to read and compose scenario definitions using an approved vocabulary while engineering owns test implementation and maintenance.

Do not overclaim: this does not mean non-technical users can fully automate any workflow without engineering support.

For methodology context across implementations: see [docs/METHODOLOGY_TRANSFER.md](METHODOLOGY_TRANSFER.md) and [docs/EVIDENCE_INDEX.md](EVIDENCE_INDEX.md).
