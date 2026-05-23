# BDD Architecture

## Purpose

This document defines the Moodle BDD Lego Steps architecture for Phase 2 test design. It explains how Cucumber scenarios should be structured before Phase 3 adds feature files, step definitions, page objects, API helpers, and CI.

The architecture preserves the Atomic -> Domain -> Composite model required by repository governance.

## Runner Choice: cucumber-js With Playwright Engine

This repository intentionally uses `cucumber-js` as the BDD runner. Playwright is the browser automation engine underneath Cucumber support code, hooks, page objects, and step definitions.

That split keeps the demo focused on reusable Lego Steps vocabulary and team-readable Gherkin instead of Playwright Test runner structure. The custom Cucumber World gives explicit control over seeded Moodle data, the environment contract, role-based sessions, evidence attachments, and Allure/Cucumber reporting.

`playwright-bdd` is a valid alternative and could be considered later if a team wants stronger Playwright-native fixtures, Trace Viewer conventions, or Playwright Test runner integration. This pass does not convert the project to `playwright-bdd` or Playwright Test.

## Why BDD Lego Steps Matter For EdTech Teams

Moodle workflows involve Product, Manual QA, Automation, and sometimes academic operations stakeholders. BDD scenarios give those groups a shared language for learning workflows, grading integrity, and permission boundaries.

New scenarios can be composed from existing approved Lego Steps without changing automation code. Senior QA Architect extends the step library when new domain behavior appears.

This keeps scenario authoring readable while avoiding the overclaim that non-technical users can automate any workflow without engineering support.

## Three-Layer BDD Model

| Layer     | Definition                                                | Primary reader             | Phase 3 ownership                    |
| --------- | --------------------------------------------------------- | -------------------------- | ------------------------------------ |
| Atomic    | Low-level reusable technical actions.                     | Automation engineers       | Senior QA Architect / QA automation  |
| Domain    | Moodle business actions using approved domain vocabulary. | QA, Product, Engineering   | Senior QA Architect with team review |
| Composite | End-to-end business workflows built from domain steps.    | Reviewers and stakeholders | QA team with architect governance    |

## Atomic Steps

Atomic steps are low-level reusable technical actions. They should be generic enough to support many Moodle workflows, but they should not leak raw selectors into feature files.

Examples of future atomic responsibilities:

- Authenticate through the Moodle UI.
- Navigate to a known Moodle page.
- Click a named Moodle action.
- Fill a named Moodle form field.
- Read visible text from a Moodle page region.
- Attach screenshot, trace, video, or API response evidence on failure.

Atomic steps are implementation-facing. They are not the preferred vocabulary for reviewer-facing scenarios.

## Domain Steps

Domain steps express Moodle business actions using approved vocabulary.

Examples:

- `Given teacher "teacher.qa" is signed in`
- `When the teacher opens course "QA Automation Demo 101"`
- `When the teacher opens assignment "Essay: Test Automation Strategy"`
- `Then the teacher can see the submission from "student.qa"`
- `When the teacher grades "student.qa" with "82 / 100"`
- `Then the gradebook shows "82 / 100" for "student.qa"`

Domain steps are the normal building blocks for feature files.

## Composite Steps

Composite steps represent end-to-end workflows built from domain steps. They are useful when a workflow has become stable and frequently reused.

Examples:

- `Given the controlled course has a submitted assignment ready for grading`
- `When the teacher completes the grading workflow for the deterministic submission`
- `Then the assignment grade and gradebook grade are reconciled`

Composite steps should remain business-readable and should not hide too much risk. If a workflow fails often or needs detailed evidence, prefer explicit domain steps until the behavior is stable.

## Moodle-Specific Step Vocabulary

Approved vocabulary should use Moodle and EdTech language:

- Teacher
- Student
- Built-in admin / future manager
- Course
- Assignment
- Submission
- Grade
- Gradebook
- Feedback
- Dashboard
- Enrolment
- Audio resource
- Teacher-only grading page

Avoid raw selectors, implementation names, and unrelated domain language in feature files.

## Good Scenario Examples

These snippets are examples of intended scenario design. They are not implementation code and should not be added as feature files in this Phase 2 documentation pass.

Teacher login and dashboard access:

```gherkin
Scenario: Teacher sees the assigned course on the dashboard
  Given teacher "teacher.qa" is signed in
  When the teacher opens the Moodle dashboard
  Then course "QA Automation Demo 101" is available to the teacher
```

Teacher opens assignment submissions:

```gherkin
Scenario: Teacher opens assignment submissions
  Given teacher "teacher.qa" is signed in
  And course "QA Automation Demo 101" has assignment "Essay: Test Automation Strategy"
  When the teacher opens the assignment submissions
  Then the submission from student "student.qa" is visible
```

Teacher grades a student submission:

```gherkin
Scenario: Teacher grades a deterministic student submission
  Given teacher "teacher.qa" is viewing submissions for "Essay: Test Automation Strategy"
  And student "student.qa" has submitted deterministic work
  When the teacher grades the submission as "82 / 100"
  Then the grade is saved for student "student.qa"
```

Gradebook validates the grade:

```gherkin
Scenario: Gradebook matches the assignment grade
  Given student "student.qa" has grade "82 / 100" for "Essay: Test Automation Strategy"
  When the teacher opens the gradebook for "QA Automation Demo 101"
  Then the gradebook shows "82 / 100" for student "student.qa"
```

Student cannot access teacher-only grading page:

```gherkin
Scenario: Student cannot access teacher-only grading
  Given student "student.qa" is signed in
  When the student attempts to open teacher-only grading for "Essay: Test Automation Strategy"
  Then access to teacher grading is denied
```

Audio resource controls are visible:

```gherkin
Scenario: Student can see audio resource controls
  Given student "student.qa" is signed in
  When the student opens audio resource "Sample Listening Task"
  Then audio controls are visible for the student
```

## Anti-Patterns

Avoid these patterns:

- Raw CSS, XPath, test IDs, or DOM structure in feature files.
- UI-only scenarios that claim gradebook correctness without API or backend reconciliation.
- Broad imperative interaction steps such as `When I click the button`, `When I enter "value"`, or `Then I see "text"` in business-facing scenarios.
- Large composite steps that hide the actual business risk being tested.
- Scenario names that describe tooling instead of Moodle behavior.
- Public demo data used as if it were deterministic CI data.
- Weakening assertions only to make a scenario pass.
- Unrelated portfolio-domain vocabulary in Moodle feature scope.

## Governance Rules

- Feature files and BDD vocabulary drive test scope and review.
- Playwright belongs inside Cucumber step definitions during implementation; the repository must not become a plain Playwright Test runner architecture.
- Feature files must not contain raw selectors.
- UI automation should use Page Objects and a UI-MAP when code is added.
- Page Objects should prefer user-facing Playwright locators (`getByRole`, `getByLabel`, `getByText`) and centralized Playwright web-first assertions through `uiExpect`. UI-MAP CSS strings are Moodle legacy fallback contracts, not the primary locator strategy.
- API helpers should support setup, teardown, and backend validation.
- Failed browser scenarios should retain Playwright Trace Viewer zip evidence when tracing is enabled.
- BDD vocabulary changes require documentation and evidence index updates.
- New workflow automation requires test scope, environment, data setup, and evidence links in the PR description.
- Any AI-assisted step implementation in Phase 3 should include a short PR note describing the prompt and acceptance criteria.

## Phase 3 Implementation Mapping

The Phase 3 skeleton maps this design into:

| Design concept        | Phase 3 implementation target                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Atomic steps          | Cucumber step definitions backed by Playwright actions and API helper calls.                                                        |
| Domain steps          | Moodle-specific Cucumber vocabulary for teacher, student, course, assignment, submission, grade, and gradebook workflows.           |
| Composite steps       | Reused workflows for controlled setup, grading lifecycle, and gradebook reconciliation.                                             |
| Page Objects / UI-MAP | Selector ownership and page interaction boundaries.                                                                                 |
| API helpers           | Setup, teardown, and canonical state validation.                                                                                    |
| Evidence hooks        | Terminal scenario/step visibility, Allure attachments, screenshots on failure, API response attachments, trace/video where enabled. |

The current skeleton provides the structure and pending step contracts. Real Moodle workflow automation remains pending until controlled Moodle selectors and Web Service functions are verified.
