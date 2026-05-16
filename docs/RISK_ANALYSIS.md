# Risk Analysis — Moodle Teacher Workflows

Purpose: concise, risk-driven table showing business impact, planned automated coverage and priority.

| Risk ID | Risk | Business impact | Severity | Likelihood | Planned automated coverage | Test layer | Priority |
|---|---|---:|---:|---:|---|---|---:|
| R1 | Teacher cannot access assigned course | Teacher cannot grade; students delayed | Critical | Medium | Full (API + E2E) | @e2e @api @security | P0 |
| R2 | Assignment is not visible or opens incorrectly | Assignments not deliverable to students | High | Medium | Full (UI + API) | @e2e @web @api | P0 |
| R3 | Student submission is not visible to teacher | Grading blocked; student support tickets | Critical | Low | Full (API + E2E) | @e2e @api | P0 |
| R4 | Teacher grade is not saved | Grade loss, reporting disputes, learner trust impact | Critical | Low | Full (API + E2E) | @e2e @api | P0 |
| R5 | Student sees wrong grade | Learner trust and reporting issues | High | Medium | API reconciliation checks + E2E spot checks | @api @e2e | P0 |
| R6 | Gradebook does not match assignment grading action | Reporting inconsistency | High | Medium | API reconciliation and E2E validation | @api @e2e | P0 |
| R7 | Student can access teacher-only grading page | Privilege escalation and integrity breach | Critical | Low | Security tests + E2E negative tests | @security @e2e | P0 |
| R8 | Dashboard/reporting count is incorrect | Operational reporting errors | Medium | Medium | API and UI checks | @api @web | P1 |
| R9 | API data and UI state drift | Confusion and inconsistent UX | High | Medium | API-first checks with UI verification | @api @web | P1 |
| R10 | Audio/media learning resource does not render or controls unavailable | Degraded learning experience | Medium | Medium | Media/audio smoke tests + manual checks | @media @web | P1 |
| R11 | Public demo instability affects test reliability | CI flakiness if public demos used | Medium | High | Mitigation: recon-only use of Mount Orange; CI uses controlled Moodle | N/A | P1 |
| R12 | Test data pollution affects repeatability | Non-deterministic failures | High | Medium | API reset helpers and scoped datasets; isolation per-suite | @api | P0 |

## Notes and mitigations
- R11 mitigation: Mount Orange is recon-only. Do not use public demos as CI targets. CI runs must use controlled Moodle.
- R12 mitigation: Provide API helpers to create, scope, and teardown seeded datasets per run. Maintain a test-data reset workflow.
