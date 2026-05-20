# Methodology Transfer Across Domains

These are portfolio implementations demonstrating QA methodology transferability across structurally different domains.

This public document references only repository evidence intended to be accessible for review. Private/local reference implementations may be used internally as pattern sources, but they are not listed as public evidence.

| Portfolio implementation                                                                                | Repository                             | Domain          | Controlled platform                       | Core workflows                                               | Main risks covered                                                             | Shared QA methodology                                                       |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------- | ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| [Hora Services Logistics QA Platform](https://github.com/vmurashev365/logistics-qa-automation-platform) | `logistics-qa-automation-platform`     | Logistics / ERP | Odoo Community demo/testbed               | Fleet, HOS/ELD, IFTA/finance, inspections, offline sync, CTI | Compliance drift, fleet data errors, offline sync issues, integration failures | Risk analysis, controlled environment, BDD Lego Steps, API/UI/DB validation |
| [Moodle Teacher QA](https://github.com/vmurashev365/moodle-edtech-qa-automation-platform)               | `moodle-edtech-qa-automation-platform` | EdTech / LMS    | Controlled Moodle instance (Docker / VPS) | Teacher dashboard, assignment lifecycle, grading, gradebook  | Grading loss, permission issues, reporting drift                               | Risk analysis, controlled environment, BDD Lego Steps, API/UI validation    |

Shared methodology (core)

1. Domain risk analysis
2. Controlled test environment (deterministic seed data)
3. Business-critical workflow mapping (scenarios)
4. BDD Lego Steps (Atomic → Domain → Composite)
5. Playwright + TypeScript automation layer implemented after design approval
6. API / UI validation and reconciliation checks
7. Allure / CI evidence publication

What changes by domain

- user roles and permission model
- business contracts and workflows
- test data shape and seeding helpers
- API helpers and backend validation points
- workflow vocabulary and Lego Steps
- risk model priority

Why this matters for a Senior QA Automation role
This approach demonstrates not just test-writing skill, but the ability to build repeatable, domain-specific QA platforms that teams can extend and maintain. The Senior QA Architect role is to own the step library, governance model, and evidence pipeline so others can reliably scale the work.
