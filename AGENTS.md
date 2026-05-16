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
