# Test Strategy

## Strategy overview
This project uses a risk-based testing strategy focused on teacher workflows that directly affect learning outcomes and reporting. Automation is layered across API and UI to provide efficient, reliable validation while keeping maintenance cost reasonable.

## Risk-based focus
- Prioritise tests that protect grading integrity, submission visibility, and role-based permissions.

## Layer definitions
- E2E tests: full UI flows validating business outcomes (what a teacher or student sees and does).
- UI tests: focused UI components and interaction stability (dashboard, assignment editor, grading UI).
- API tests: setup, teardown, and direct backend validation to assert canonical state and speed up feedback.
- Security / permission tests: role-based access control checks and unauthorized access attempts.
- Media / audio tests: render, playback controls and availability checks for learning resources.
- Smoke tests: minimal, fast checks validating core flows on deployment.
- Regression tests: broader suites that run on scheduled CI to detect regressions.

## What each layer proves
- E2E: business flows and user-visible outcomes.
- API: data correctness, side effects, and faster validation of edge conditions.
- UI: interaction fidelity and rendering correctness.

## What each layer should not try to prove
- UI-only tests should not be the sole source of truth for backend data correctness.
- API tests should not replace UX validation when user interaction matters.

## Why API validation matters
- API validation confirms canonical state, reduces flakiness, and provides faster failure feedback. It is essential for gradebook reconciliation checks that are expensive to validate reliably via UI alone.

## Why UI-only automation is insufficient
- UI-only tests are brittle and slower and may miss discrepancies between UI and backend state. Combine API checks for authoritative signals and use UI for human-facing assertions.

## How manual QA and automation work together
- Automation provides repeatable regression coverage; manual QA focuses on exploratory, accessibility, and emergent behavior testing. Automation frees manual testers to explore higher-value scenarios.

## How BDD Lego Steps support team scaling
New scenarios can be composed from existing approved Lego Steps without changing automation code. Senior QA Architect extends the step library when new domain behavior appears. This enables consistent vocabulary and lowers the barrier for readable, reviewable scenarios.

## Planned tagging model
- @smoke
- @e2e
- @web
- @api
- @security
- @media
- @teacher
- @student
- @gradebook
- @assignment

Tags will be used to control CI execution windows (fast smoke vs full regression) and to group evidence in Allure.
