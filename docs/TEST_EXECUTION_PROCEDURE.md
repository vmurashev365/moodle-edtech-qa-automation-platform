# Test Execution Procedure

## Purpose
This document explains how to run the automation skeleton, the Phase 4 local Moodle smoke, the Phase 5 local teacher workflow, the Phase 6 grading readiness gate, and CI-safe checks.

The current framework is executable. The Phase 4 local smoke verifies the controlled Moodle login page. Phase 5 adds a teacher-facing submission review path that requires controlled seed data. Phase 6 grading/gradebook steps remain `@wip` until grading selectors, grade save behavior, and gradebook selectors are verified.

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

Update `.env` with any non-demo credentials, audio resource, and API token values. After seeding, run `npm run moodle:seed:env` to apply generated Moodle IDs and URLs into local `.env`.

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

## Controlled Seed Command
Create or refresh the deterministic local Moodle data:

```bash
npm run moodle:start
npm run moodle:wait
npm run moodle:seed
npm run moodle:seed:env
```

The seed runs PHP inside the local Docker Moodle container and uses Moodle internal APIs for users, course creation/update, manual enrolments, assignment creation/update, and online text submission setup. It is idempotent and does not silently edit `.env`. It writes ignored local metadata to `artifacts/seed/controlled-data.generated.json`.

`npm run moodle:seed:env` explicitly updates the untracked local `.env` from that generated artifact. If `.env` is missing, it is created from `.env.example`. If `.env` already exists, a timestamped `.env.backup.*` file is created first. The sync updates only deterministic Moodle metadata and preserves unrelated variables and nonblank teacher/student passwords. Blank teacher/student passwords are filled with the documented local-only demo password that satisfies Moodle password policy. Generated URLs use Moodle's configured local `wwwroot` so browser login sessions stay aligned with the running instance.

The generated artifact is local setup metadata, not public proof by itself. Recorder/Codegen selector discovery comes after seed readiness passes.

Convenience readiness command:

```bash
npm run moodle:seed:ready
```

This runs seed, `.env` sync, `check:data`, and `check:grading-data` in sequence.

## Phase 5 Seed Checklist
Before running the teacher workflow, create or confirm with `npm run moodle:seed`:

- teacher user matching `MOODLE_TEACHER_USERNAME`
- student user matching `MOODLE_STUDENT_USERNAME`
- student first/display name matching `MOODLE_STUDENT_DISPLAY_NAME`, for example `Student QA`
- course `QA Automation Demo 101`
- teacher enrolment in the controlled course
- student enrolment in the controlled course
- assignment `Essay: Test Automation Strategy`
- deterministic student submission visible in the assignment submissions page

Then run `npm run moodle:seed:env` so the generated course, assignment, submissions, gradebook, and display-name values are written to local `.env`.

## Phase 6 Grading Seed Checklist
Before removing `@wip` from the grading scenario or running it as evidence, confirm:

- Phase 5 controlled seed checklist is complete
- deterministic `Student QA` submission appears in the assignment submissions page
- `MOODLE_ASSIGNMENT_SUBMISSIONS_URL` or `MOODLE_ASSIGNMENT_ID`/`MOODLE_ASSIGNMENT_URL` is configured
- `MOODLE_GRADEBOOK_URL`, `MOODLE_COURSE_ID`, or `MOODLE_COURSE_URL` is configured
- assignment grade scale accepts `MOODLE_TARGET_GRADE`, default `82`
- teacher can save the grade manually in the controlled instance
- gradebook displays the saved grade for `MOODLE_STUDENT_DISPLAY_NAME`

The seed does not pre-grade the submission. Do not treat the generated local artifact as gradebook evidence.

## Docker Start / Stop / Reset
Start the local controlled Moodle stack:

```bash
npm run moodle:start
```

Wait until Moodle is reachable:

```bash
npm run moodle:wait
```

Seed the deterministic local data:

```bash
npm run moodle:seed
```

Apply generated IDs and URLs to local `.env`:

```bash
npm run moodle:seed:env
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

The Docker image may still require Moodle admin setup or Web Services enablement for later API work. The Phase 6A.1 seed creates the controlled users, course, assignment, enrolments, and deterministic online-text submission needed for local selector discovery.

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

`check:data` validates the local `.env` contract only. Run `npm run moodle:seed` and `npm run moodle:seed:env` first.

Run the Phase 6 grading data contract check:

```bash
npm run check:grading-data
```

`check:grading-data` validates the local grading/gradebook contract only. It does not enter grades or create gradebook evidence.

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

Phase 6 local grading workflow gate:

```bash
npm run test:local:grading
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

`test:local:teacher-workflow` is local-only and requires the controlled seed checklist above. If data is missing, the scenario should fail with a setup blocker rather than pass.

`test:local:grading` is local-only and currently blocks on `check:grading-data` until the controlled grading seed contract is configured and the `@wip` grading scenario is verified.

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

CI does not start Moodle, does not run `npm run moodle:seed`, does not run `npm run moodle:seed:env`, does not run WIP Moodle UI flows, does not run `test:local:smoke`, does not run `test:local:teacher-workflow`, does not run `test:local:grading`, and does not target Mount Orange. Local Moodle workflow execution remains manual until a controlled Moodle service is intentionally added to CI.
