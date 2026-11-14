# BDD Architecture

## Purpose

This document defines how Cucumber scenarios, step definitions, page objects and backend helpers are structured in this repository.

A scenario is a specification of a Moodle business rule. Product, clients, QA and engineers read the same text, and the report shows what each check compared. The earlier Atomic -> Domain -> Composite step layers were replaced by one layer of domain steps; the layering now lives in the code below the steps.

## Runner Choice: cucumber-js With Playwright Engine

This repository intentionally uses `cucumber-js` as the BDD runner. Playwright is the browser automation engine underneath Cucumber support code, hooks, page objects, and step definitions.

That split keeps the demo focused on reusable Lego Steps vocabulary and team-readable Gherkin instead of Playwright Test runner structure. The custom Cucumber World gives explicit control over seeded Moodle data, the environment contract, role-based sessions, evidence attachments, and Allure/Cucumber reporting.

`playwright-bdd` is a valid alternative and could be considered later if a team wants stronger Playwright-native fixtures, Trace Viewer conventions, or Playwright Test runner integration. This pass does not convert the project to `playwright-bdd` or Playwright Test.

## Why BDD Lego Steps Matter For EdTech Teams

Moodle workflows involve Product, Manual QA, Automation, and sometimes academic operations stakeholders. BDD scenarios give those groups a shared language for learning workflows, grading integrity, and permission boundaries.

New scenarios can be composed from existing approved Lego Steps without changing automation code. Senior QA Architect extends the step library when new domain behavior appears.

This keeps scenario authoring readable while avoiding the overclaim that non-technical users can automate any workflow without engineering support.

## Structure

| Level                | What it holds                                                                                           | Where                        |
| -------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Scenario             | One business rule, in Moodle's terms, with the actor named.                                             | `features/`                  |
| Domain steps         | The only step layer: the Lego Steps. Each step resolves the names it is given and calls the code below. | `src/steps/`                 |
| Domain logic         | Pure functions: seeded-data lookup and comparison records. Unit-tested.                                 | `src/domain/`, `tests/unit/` |
| Page Objects         | Page interactions and selectors.                                                                        | `src/pages/`                 |
| Backend and evidence | Moodle CLI access, hooks, the World, report attachments.                                                | `src/support/`, `src/utils/` |

There are no generic UI steps (open a path, click, fill, see text) and no steps that only chain other steps. A step may perform several page operations when together they are one business action, such as grading a submission. Reuse belongs in the levels below the steps.

## Domain Steps

Domain steps express Moodle business actions using approved vocabulary. The implemented ones:

- `Given teacher "teacher.qa" is signed in`
- `Given student "student.qa" is signed in`
- `Given student "student.qa" has an ungraded submission for "Essay: Test Automation Strategy"`
- `When the teacher opens "My courses" from the dashboard`
- `When the teacher opens course "QA Automation Demo 101"`
- `When the teacher opens assignment "Essay: Test Automation Strategy"`
- `When the teacher opens grading for the assignment`
- `When the teacher grades the submission from student "student.qa" as "82"`
- `When the teacher opens the gradebook for "QA Automation Demo 101"`
- `Then the teacher sees the submission from student "student.qa" as submitted and not graded`
- `Then the gradebook shows "82.00" for student "student.qa"`
- `Then the grade recorded for student "student.qa" is "82" in both the assignment and the gradebook`

### Names In Steps Are Looked Up, Not Decorative

A quoted name in a domain step is resolved against the controlled data the seed created (`src/domain/controlled-entities.ts`, loaded from the seed artifact). An unknown teacher, student, course or assignment fails the step by name and lists the known ones. A second student or course therefore needs seed data and a scenario, not a new step.

What becomes a parameter is one of a set of like things: a student, a course, an assignment, an item of the main menu. A main menu item comes from a closed list in which every item has the page it must open, so `the teacher opens "My courses" from the dashboard` is not a general "click this text" step, and an item outside the list fails by name. A single business action, such as opening grading for an assignment, stays in words. Nested navigation will be written as a path of visible labels joined by `>` when a scenario first needs it.

A scenario states which submission it is about once, in a `Given`. That step puts the submission into its starting state (the grade is reset through Moodle's grading API) and verifies the state in Moodle's records. Later steps that say "the submission" or "the gradebook shows …" refer to it, and fail if no submission was established.

Steps use Moodle's own terms and name the actor ("the teacher", "the student", "a visitor"). Test-engineering words such as "deterministic", "controlled", "configured" or "target" do not belong in steps, and whether the environment is up is checked by a hook, not stated in the scenario.

### Comparison Evidence Under A Step

A step that checks a value attaches a comparison record before it asserts, so the record is in the report on passing runs too. The record (`src/domain/comparison.ts`) states the rule and, for every compared value, the field, where the actual value was read from, the expected value, the actual value and the result. The step then asserts from that same record, so what the report shows and what the step verified cannot differ.

For a check in the browser, the page assertions run first and keep their own strictness; the record is then built from the elements that hold just the compared values, and the step fails if either the record or the page assertions fail (`verifyWithComparison` in `src/utils/evidence.ts`). Building a record is a pure function with unit tests under `tests/unit/`.

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
- Grading page

Avoid raw selectors, implementation names, and unrelated domain language in feature files.

## Scenario Examples

Implemented, from `features/`:

```gherkin
Scenario: A grade saved by the teacher reaches the gradebook unchanged
  Given teacher "teacher.qa" is signed in
  And student "student.qa" has an ungraded submission for "Essay: Test Automation Strategy"
  When the teacher grades the submission from student "student.qa" as "82"
  And the teacher opens the gradebook for "QA Automation Demo 101"
  Then the gradebook shows "82.00" for student "student.qa"
  And the grade recorded for student "student.qa" is "82" in both the assignment and the gradebook
```

```gherkin
Rule: Only a teacher can grade a submission

  Scenario: A student cannot save a grade by sending the grading request directly
    Given student "student.qa" is signed in
    And student "student.qa" has an ungraded submission for "Essay: Test Automation Strategy"
    When the student sends the grading request for that submission with grade "82"
    Then Moodle refuses with a permission error for grading
    And the submission from student "student.qa" is still not graded
```

The second scenario checks a technical boundary, and its audience includes engineers and security reviewers. Its title still states the business rule; the HTTP status, error code and session details stay in the step implementation and in the comparison record.

Designed, still `@wip` (their pending steps fail with an explicit message):

```gherkin
Scenario: Teacher dashboard shows controlled course
  Given teacher "teacher.qa" is signed in
  When the teacher opens the Moodle dashboard
  Then course "QA Automation Demo 101" is available to the teacher
```

```gherkin
Scenario: Student opens audio resource and controls are visible
  Given student "student.qa" is signed in
  When the student opens audio resource "Sample Listening Task"
  Then audio controls are visible for the student
```

## Anti-Patterns

Avoid these patterns:

- Raw CSS, XPath, test IDs, or DOM structure in feature files.
- UI-only scenarios that claim gradebook correctness without API or backend reconciliation.
- Broad imperative interaction steps such as `When I click the button`, `When I enter "value"`, or `Then I see "text"`.
- Steps that bundle checks of different business rules, or that only chain other steps.
- A quoted name that the step does not look up, so any text would pass.
- Scenario names that describe tooling instead of Moodle behavior.
- Public demo data used as if it were deterministic CI data.
- Weakening assertions only to make a scenario pass.
- Unrelated portfolio-domain vocabulary in Moodle feature scope.

## Governance Rules

- Feature files and BDD vocabulary drive test scope and review.
- Playwright belongs inside Cucumber step definitions during implementation; the repository must not become a plain Playwright Test runner architecture.
- Feature files must not contain raw selectors. Selectors live in Page Objects.
- Page Objects should prefer user-facing Playwright locators (`getByRole`, `getByLabel`, `getByText`) and centralized Playwright web-first assertions through `uiExpect`. A Moodle CSS hook is used where no user-facing locator identifies the element, with a comment saying what it is.
- API helpers should support setup, teardown, and backend validation.
- Failed browser scenarios should retain Playwright Trace Viewer zip evidence when tracing is enabled.
- BDD vocabulary changes require a CHANGELOG entry and documentation and evidence index updates.
- New workflow automation requires test scope, environment, data setup, and evidence links in the PR description.

## Implementation Status

The login smoke, the teacher submission review, the teacher grading scenario and the two role-access scenarios run against the local controlled Moodle. The remaining scenarios stay `@wip` with pending step contracts until their Moodle selectors and Web Service functions are verified. Backend state is read and reset through the Moodle CLI inside the container, not through Moodle Web Services.
