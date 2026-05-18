# Test Execution Procedure

## Purpose
This document explains how to run the automation skeleton, the Phase 4 local Moodle smoke, the Phase 5 local teacher workflow, and CI-safe checks.

The current framework is executable. The Phase 4 local smoke verifies the controlled Moodle login page. Phase 5 adds a teacher-facing submission review path that requires manually seeded controlled data. Broader Moodle UI workflows remain tagged `@wip` until controlled Moodle selectors, grading behavior, and Web Service functions are verified.

## Local Setup
Use Node.js `24.x` to match the repository engine and GitHub Actions configuration.

Install dependencies:

```bash
npm install
npm run install:browsers
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with controlled Moodle credentials and the final course, assignment, audio resource, and API token values.

## Environment Variables
Key variables:

- `MOODLE_BASE_URL`
- `MOODLE_TEACHER_USERNAME`
- `MOODLE_TEACHER_PASSWORD`
- `MOODLE_STUDENT_USERNAME`
- `MOODLE_STUDENT_PASSWORD`
- `MOODLE_MANAGER_USERNAME`
- `MOODLE_MANAGER_PASSWORD`
- `MOODLE_API_TOKEN`
- `MOODLE_COURSE_NAME`
- `MOODLE_ASSIGNMENT_NAME`
- `MOODLE_AUDIO_RESOURCE_NAME`
- `MOODLE_TARGET_GRADE`
- `MOODLE_COURSE_ID` or `MOODLE_COURSE_URL`
- `MOODLE_ASSIGNMENT_ID` or `MOODLE_ASSIGNMENT_URL`
- `MOODLE_ASSIGNMENT_SUBMISSIONS_URL`
- `MOODLE_STUDENT_DISPLAY_NAME`

The API token may be blank during skeleton validation. API mutation and backend reconciliation helpers remain pending until Moodle Web Services are configured.

## Phase 5 Manual Seed Checklist
Phase 5 uses manual seed data until Moodle Web Services are verified. Before running the teacher workflow, create or confirm:

- teacher user matching `MOODLE_TEACHER_USERNAME`
- student user matching `MOODLE_STUDENT_USERNAME`
- student first/display name matching `MOODLE_STUDENT_DISPLAY_NAME`, for example `Student QA`
- course `QA Automation Demo 101`
- teacher enrolment in the controlled course
- student enrolment in the controlled course
- assignment `Essay: Test Automation Strategy`
- deterministic student submission visible in the assignment submissions page

Then set at least `MOODLE_COURSE_ID` or `MOODLE_COURSE_URL` in `.env`. Set `MOODLE_ASSIGNMENT_ID`, `MOODLE_ASSIGNMENT_URL`, or `MOODLE_ASSIGNMENT_SUBMISSIONS_URL` when available for more deterministic navigation.

## Docker Start / Stop / Reset
Start the local controlled Moodle stack:

```bash
npm run moodle:start
```

Wait until Moodle is reachable:

```bash
npm run moodle:wait
```

Stop it:

```bash
npm run moodle:stop
```

Reset volumes and start again:

```bash
npm run moodle:reset
```

Inspect logs:

```bash
npm run moodle:logs
```

The Docker image may still require Moodle admin setup, role configuration, course creation, Web Services enablement, and test-data seeding after the containers are running.

The default Docker images are configurable through `MOODLE_DOCKER_IMAGE` and `MARIADB_DOCKER_IMAGE`. They are intended for local controlled validation; pin or mirror approved images before relying on the stack long term.

## Static Validation
Run TypeScript validation:

```bash
npm run type-check
```

Run the environment contract check:

```bash
npm run verify:env
```

Run the Phase 5 controlled data contract check:

```bash
npm run check:data
```

`check:data` validates the local `.env` contract only. It does not create Moodle users, courses, assignments, or submissions.

## Cucumber Suite Commands
Safe skeleton API preflight:

```bash
npm run test:api
```

First real local controlled-Moodle smoke:

```bash
npm run test:local:smoke
```

First local teacher workflow:

```bash
npm run test:local:teacher-workflow
```

Suite commands prepared for later implementation:

```bash
npm run test:smoke
npm run test:web
npm run test:e2e
npm run test:security
npm run test:media
npm run test:all
```

The commands above exclude `@wip`. Until real Moodle selectors and API helpers are implemented, most UI suites may select no executable scenarios.

`test:local:smoke` requires the local controlled Moodle instance to be running and reachable. It does not require teacher/student/course/assignment provisioning.

`test:local:teacher-workflow` is local-only and requires the manual Phase 5 seed checklist above. If data is missing, the scenario should fail with a setup blocker rather than pass.

## WIP / Pending Behavior
Run WIP scenarios deliberately:

```bash
npm run test:wip
```

WIP scenarios contain pending step implementations and are expected to fail with explicit pending messages. This is intentional and prevents fake-green automation.

## Allure Report Commands
Generate an Allure report from available results:

```bash
npm run report:allure
```

Open the generated report:

```bash
npm run report:allure:open
```

The public Allure report link remains TBD until a real controlled Moodle run is published.

## CI Limitations Before Moodle Workflow Execution
GitHub Actions currently validates:

- dependency installation
- TypeScript type-check
- lint script
- environment contract
- safe API preflight scenario
- report artifact upload

CI does not run WIP Moodle UI flows, does not run `test:local:smoke`, does not run `test:local:teacher-workflow`, and does not target Mount Orange. Local Moodle workflow execution remains manual until a controlled Moodle service is intentionally added to CI.
