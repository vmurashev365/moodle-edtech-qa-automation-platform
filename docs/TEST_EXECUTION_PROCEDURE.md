# Test Execution Procedure

## Purpose
This document explains how to run the Phase 3 automation skeleton locally and in CI.

The current framework is executable, but most Moodle UI workflows remain tagged `@wip` until controlled Moodle selectors and Web Service functions are verified.

## Local Setup
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
npm run docker:start
```

Stop it:

```bash
npm run docker:stop
```

Reset volumes and start again:

```bash
npm run docker:reset
```

The Docker image may still require Moodle admin setup, role configuration, course creation, Web Services enablement, and test-data seeding after the containers are running.

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

CI does not run WIP Moodle UI flows and does not target Mount Orange. Executable Moodle UI/API regression requires a controlled local or VPS Moodle instance with deterministic data and verified Web Services.
