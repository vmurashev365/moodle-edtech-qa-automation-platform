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

## Workflows validated (MVP)
- Teacher dashboard
- Course access
- Assignment lifecycle
- Student submission
- Teacher grading
- Gradebook validation
- Role-based access
- Selected media/audio resource checks
- API-backed test data setup and backend validation

## User roles covered
- teacher
- student
- manager/admin

## Test types included
- E2E, UI, API, security/permission checks, media/audio checks, smoke and regression suites.

## How automation supports manual QA
Automation provides repeatable regression coverage and fast feedback for business-critical flows. Manual QA focuses on exploratory testing, human-centric edge cases, and accessibility contexts that are not yet automated.

## How reports and evidence are produced
- Automation artifacts are published to Allure and archived via CI runs (GitHub Actions). Video or recorded recon notes are linked from the evidence index. Phase 1 contains placeholders; Phase 2/3 will publish concrete links.

## Controlled environment approach
Public Moodle demos are useful for discovery and exploratory recon only. Stable automated tests must be executed against a controlled Moodle instance (local Docker or VPS) seeded and reset for each run.

## Reusable BDD Lego Steps as team multiplier
New scenarios can be composed from existing approved Lego Steps without changing automation code. Senior QA Architect extends the step library when new domain behavior appears.

This enables Product Owners, Manual QA, and Junior engineers to read and compose scenario definitions using an approved vocabulary while engineering owns test implementation and maintenance.

Do not overclaim: this does not mean non-technical users can fully automate any workflow without engineering support.
