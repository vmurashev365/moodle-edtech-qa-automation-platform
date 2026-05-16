# Test Execution Procedure

## Purpose
This document explains how to run the automation skeleton, the Phase 4 local Moodle smoke, and CI-safe checks.

The current framework is executable. The Phase 4 local smoke verifies the controlled Moodle login page. Broader Moodle UI workflows remain tagged `@wip` until controlled Moodle selectors, users, course data, and Web Service functions are verified.

## Local Setup
Use Node.js `24.x` to match the repository engine and GitHub Actions configuration.

Install dependencies:

```bash
npm install
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

The API token may be blank during skeleton validation. API mutation and backend reconciliation helpers remain pending until Moodle Web Services are configured.

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

## Cucumber Suite Commands
Safe skeleton API preflight:

```bash
npm run test:api
```

First real local controlled-Moodle smoke:

```bash
npm run test:local:smoke
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

## CI Limitations Before Controlled Moodle Is Available
CI currently validates:

- dependency installation
- TypeScript type-check
- lint script
- environment contract
- safe API preflight scenario
- report artifact upload

CI does not run WIP Moodle UI flows, does not run `test:local:smoke`, and does not target Mount Orange. Executable Moodle UI/API regression in CI can be added later after the controlled service setup is stable.
