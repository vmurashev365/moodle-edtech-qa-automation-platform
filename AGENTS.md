# AGENTS.md — AI & contributor governance

Purpose: governance for contributors and AI-assisted contributions (Copilot, Codex, prompts) to preserve framework consistency and Cucumber-first architecture.

Rules
- This is a Cucumber-first framework. Feature files and the BDD vocabulary drive test scope and review.
- Use Playwright as the browser automation engine inside Cucumber step definitions. Do not convert this repository into a plain Playwright Test runner architecture.
- Preserve the Atomic → Domain → Composite BDD model when designing steps and features.
- Feature files must not contain raw selectors; keep selectors in Page Objects or UI-MAP layers.
- Use Page Objects and a UI-MAP for UI automation when code is added (phase 2+).
- API helpers must support test data setup, teardown, and backend validation.
- Stable automated tests must run against a controlled local or VPS Moodle instance seeded with deterministic data. Mount Orange Moodle demo is recon-only.
- Do not weaken assertions (e.g., removing checks) just to make tests green. Fail fast and document reasons for any workaround.
- Documentation must stay in sync with code and test scope. New workflows require updates to documentation and the evidence index.
- Avoid over-documentation: keep docs lean, pragmatic and tied to actual testing value.
- When using AI/code-generation tools for step implementations or helpers, include a short note in the PR describing the prompt and acceptance criteria.
- Do not imply or reference any certification (e.g. ISTQB) in documentation or governance.
- Acme, Hora and Moodle are portfolio implementations. Do not describe them as client engagements.

Pull request guidance
- Include test scope, environment, data setup, and evidence links in the PR description.
- Link feature files, step changes, and any environment artifacts used by the PR.

Versioning and change control
- Document changes to BDD vocabulary in a changelog entry and update relevant docs and the evidence index.

## Local reference folders

This repository may contain local-only reference folders such as:

- `_reference_acme_storefront/`
- `_reference_hora_logistics/`

These folders are gitignored and must never be committed.

They are read-only reference implementations used to compare architecture patterns, documentation structure, BDD layering, Allure/CI evidence design and API/UI validation approach.

Rules:

- Do not edit files inside `_reference_*` folders.
- Do not copy code blindly from reference projects.
- Extract patterns and adapt them to Moodle / EdTech / LMS requirements.
- Public documentation must reference external GitHub URLs, not local-only folders.
- Do not import, require, or depend on code from `_reference_*`.
- Do not use e-commerce or logistics terminology in Moodle features unless it is part of methodology comparison documentation.
- Never commit secrets, `.env` files, generated reports, screenshots, videos, traces, HAR files, or local artifacts from reference folders.
