# Methodology Transfer Across Domains

These are portfolio implementations demonstrating QA methodology transferability across structurally different domains.

| Portfolio implementation | Domain | Controlled platform | Core workflows | Main risks covered | Shared QA methodology |
|---|---|---|---|---|---|
| Acme Linens Demo Store | E-commerce | Demo store / Shopify | Release gate, cart, checkout, pricing integrity | Checkout breakage, pricing errors | Risk analysis, controlled env, BDD Lego Steps, API/UI validation |
| Hora Services Logistics QA Platform | Logistics | Odoo Community (demo) | Order lifecycle, routing, tracking, compliance checks | Routing errors, data loss | Risk analysis, controlled env, BDD Lego Steps, API/UI validation |
| Moodle Teacher QA | EdTech / LMS | Controlled Moodle instance (Docker / VPS) | Teacher dashboard, assignment lifecycle, grading, gradebook | Grading loss, permission issues | Risk analysis, controlled env, BDD Lego Steps, API/UI validation |

Shared methodology (core)
1. Domain risk analysis
2. Controlled test environment (deterministic seed data)
3. Business-critical workflow mapping (scenarios)
4. BDD Lego Steps (Atomic → Domain → Composite)
5. Playwright + TypeScript automation (phase 2)
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
This work demonstrates that the candidate is not only writing tests but building repeatable, domain-specific QA platforms that scale across contexts. The Senior QA Architect designs the step library, governance, and evidence model so other teams can reliably repeat and extend the work.
