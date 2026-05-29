# Test Execution Procedure

## Purpose

This document explains how to run the automation skeleton, the Phase 4 local Moodle smoke, the Phase 5 local teacher workflow, the Phase 6 local grading/gradebook workflow, and CI-safe checks.

The current framework is executable. The Phase 4 local smoke verifies the controlled Moodle login page. Phase 5 adds a teacher-facing submission review path that requires controlled seed data. Phase 6 adds one local UI proof for teacher grading and gradebook row verification after deterministic seeding.

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
- `MOODLE_STUDENT_EMAIL`
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
- `MOODLE_ASSIGNMENT_GRADING_URL`
- `MOODLE_STUDENT_ID`
- `MOODLE_SUBMISSION_ID`
- `MOODLE_STUDENT_DISPLAY_NAME`
- `MOODLE_EXECUTION_PROFILE` (`demo` or `fast`)
- `MOODLE_HEADLESS`
- `MOODLE_SLOW_MO_MS`
- `MOODLE_STEP_DELAY_MS`
- `MOODLE_SCREENCAST`
- `MOODLE_TRACE_MODE` (`off`, `retain-on-failure`, `on`, or `all`)
- `MOODLE_VIDEO_MODE` (`off`, `retain-on-failure`, or `on`)
- `MOODLE_TERMINAL_STEPS`
- `UI_EXPECT_TIMEOUT_MS` for Page Object Playwright assertions, default `10000`

The API token may be blank during skeleton validation. API mutation and backend reconciliation helpers remain pending until Moodle Web Services are configured.
Legacy `HEADLESS`, `TRACE_MODE`, `TRACE_ON_FAILURE`, and `VIDEO_ON_FAILURE` variables are kept only for compatibility/deprecation clarity. Prefer the `MOODLE_*` runtime variables above for new local runs and CI configuration.

## Execution Profiles

The framework has two runtime profiles:

- `demo`: headed browser, visible scenario/step terminal output, small pacing delays, and optional screencast/video with click feedback for reviewer walkthroughs.
- `fast`: headless, no artificial delays, and suitable for CI/CD validation.

The Moodle profile is named `demo` rather than production because the target is a local controlled Moodle demo instance, not a protected production or WAF-backed application.

Run local demo workflows after seeding:

```bash
npm run moodle:start
npm run moodle:wait
npm run moodle:seed:ready
npm run test:demo:smoke
npm run test:demo:teacher-workflow
npm run test:demo:grading
npm run test:demo:screencast:all
```

The teacher-workflow and grading demo/fast scripts run `moodle:seed:ready` before their scenario so they remain deterministic after a previous grading run.

Record visible walkthroughs:

```bash
npm run test:demo:screencast:all
npm run test:demo:screencast:grading
```

Generate an Allure report for a local review run:

```bash
npm run test:demo:grading:report
npm run test:demo:screencast:all
npm run test:demo:screencast:grading
npm run test:fast:grading:report
```

The report wrapper clears stale Allure results, runs the selected Cucumber command, generates `reports/allure-report/` even when the scenario fails, opens the local Allure viewer automatically outside CI, and returns the original test exit code. Set `ALLURE_AUTO_OPEN=false` to generate the report without launching the viewer. Moodle-specific metadata is written into `reports/allure-results/environment.properties`, `executor.json`, and `categories.json`.

Run fast checks:

```bash
npm run type-check
npm run lint
npm run format:check
npm run verify:env
npm run test:fast:api
```

## Controlled Seed Command

Create or refresh the deterministic local Moodle data:

```bash
npm run moodle:start
npm run moodle:wait
npm run moodle:seed
npm run moodle:seed:env
```

The seed runs PHP inside the local Docker Moodle container and uses Moodle internal APIs for users, course creation/update, manual enrolments, assignment creation/update, online text submission setup, and assignment grade reset. It is idempotent and does not silently edit `.env`. It writes ignored local metadata to `artifacts/seed/controlled-data.generated.json`.

`npm run moodle:seed:env` explicitly updates the untracked local `.env` from that generated artifact. If `.env` is missing, it is created from `.env.example`. If `.env` already exists, a timestamped `.env.backup.*` file is created first. The sync updates deterministic Moodle metadata from the generated `envSnippet`, including `MOODLE_STUDENT_ID`, `MOODLE_STUDENT_EMAIL`, `MOODLE_SUBMISSION_ID`, and `MOODLE_ASSIGNMENT_GRADING_URL`, and preserves unrelated variables and nonblank teacher/student passwords. Blank teacher/student passwords are filled with the documented local-only demo password that satisfies Moodle password policy. Generated URLs use Moodle's configured local `wwwroot` so browser login sessions stay aligned with the running instance.

`npm run moodle:seed:auth` verifies the seeded teacher and student credentials through Moodle's CLI authentication path. It runs after `.env` sync inside `npm run moodle:seed:ready` so a bad seeded password fails before browser UI steps.

The generated artifact is local setup metadata, not public proof by itself. Mission 6 Recorder/Codegen evidence is local under ignored `tools/recordings/localhost_mission6`.

Convenience readiness command:

```bash
npm run moodle:seed:ready
```

This runs seed, `.env` sync, seeded auth verification, `check:data`, and `check:grading-data` in sequence.

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

Before running the grading scenario as evidence, confirm:

- Phase 5 controlled seed checklist is complete
- deterministic `Student QA` submission appears in the assignment submissions page
- `MOODLE_ASSIGNMENT_SUBMISSIONS_URL` or `MOODLE_ASSIGNMENT_ID`/`MOODLE_ASSIGNMENT_URL` is configured
- `MOODLE_ASSIGNMENT_GRADING_URL` or enough assignment/student metadata to derive it is configured
- `MOODLE_GRADEBOOK_URL`, `MOODLE_COURSE_ID`, or `MOODLE_COURSE_URL` is configured
- assignment grade scale accepts `MOODLE_TARGET_GRADE`, default `82`
- seed reset leaves Student QA grading baseline as not graded
- the UI scenario saves the target grade and gradebook displays it for `MOODLE_STUDENT_DISPLAY_NAME`

The seed does not pre-grade the submission with the target grade. It resets the controlled grade to Moodle's ungraded baseline through the assign grading API so the UI scenario must perform the write. Do not treat the generated local artifact as gradebook evidence.

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

The Docker image may still require Moodle admin setup or Web Services enablement for later API work. The seed creates the controlled users, course, assignment, enrolments, deterministic online-text submission, and ungraded baseline needed for local grading validation.

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

Readiness-only alias:

```bash
npm run check:local:grading-readiness
```

This is the Phase 6 data-contract readiness command. It does not enter grades or prove gradebook behavior.

## Cucumber Suite Commands

Safe skeleton API preflight:

```bash
npm run test:api
```

Fast API alias:

```bash
npm run test:fast:api
```

Allure report alias for CI-safe API evidence:

```bash
npm run test:fast:api:report
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

The commands above exclude `@wip`. Suites that still target planned security, media, or broader UI coverage may select no executable scenarios until their Moodle selectors and API helpers are implemented.

`test:local:smoke` requires the local controlled Moodle instance to be running and reachable. It does not require teacher/student/course/assignment provisioning.

`test:local:teacher-workflow` is local-only and requires the controlled seed checklist above. If data is missing, the scenario should fail with a setup blocker rather than pass.

`test:local:grading` is local-only and guarded against false green results. It runs the grading data check, then fails intentionally if Cucumber selects zero executable Phase 6 scenarios. After `npm run moodle:seed:ready`, it should select one executable scenario and prove the UI grading plus gradebook row verification path.

## Failure Evidence

For Cucumber browser scenarios, Playwright tracing starts in the Cucumber World when `MOODLE_TRACE_MODE` is not `off`. The default is `retain-on-failure`.

- `MOODLE_TRACE_MODE=off`: no trace capture
- `MOODLE_TRACE_MODE=retain-on-failure`: save `traces/<safe-scenario-name>-trace.zip` only for failed scenarios
- `MOODLE_TRACE_MODE=on` or `MOODLE_TRACE_MODE=all`: save traces for every browser scenario
- `MOODLE_VIDEO_MODE=on`: save videos for every browser scenario
- `MOODLE_VIDEO_MODE=retain-on-failure`: keep videos only for failed browser scenarios

Trace zips are ignored by git and attached to Cucumber/Allure results where the reporter supports binary attachments. Demo videos are written under ignored `videos/`, screenshots under ignored `screenshots/`, and local reports under ignored `reports/`.

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

## Manual GitHub Actions Workflow

The **Manual Moodle Test Run** workflow is launched from GitHub Actions with `workflow_dispatch`. It is intended for QA/developer runs from a laptop, tablet, phone, or GitHub mobile app.

Available suites:

- `fast-api`: CI-safe API/environment preflight, no local Moodle Docker.
- `local-smoke`: starts local Moodle in GitHub Actions and verifies the login page.
- `local-teacher-workflow`: starts Moodle, seeds deterministic data, and runs the teacher submission-review workflow.
- `local-grading`: starts Moodle, seeds the ungraded baseline, grades Student QA, and verifies the gradebook.
- `local-demo-screencast-all`: runs `npm run test:demo:screencast:all` headlessly in GitHub Actions, with Allure/Cucumber evidence plus video/click-visualizer artifacts.

The workflow uploads local evidence artifacts from `reports/`, `screenshots/`, `videos/`, `traces/`, and sanitized seed metadata. Optional stakeholder email uses SMTP secrets and sends a short digest with the run link and artifact locations; large reports/videos stay in GitHub Actions artifacts.

Required email secrets when email sending is enabled:

- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `QA_REPORT_RECIPIENTS`
- `QA_REPORT_FROM`

## CI Limitations Before Moodle Workflow Execution

GitHub Actions currently validates:

- dependency installation
- TypeScript type-check
- lint script
- environment contract
- safe API preflight scenario
- report artifact upload

CI does not start Moodle, does not run `npm run moodle:seed`, does not run `npm run moodle:seed:env`, does not run WIP Moodle UI flows, does not run `test:local:smoke`, does not run `test:local:teacher-workflow`, does not run `test:local:grading`, and does not target Mount Orange. Local Moodle workflow execution remains manual until a controlled Moodle service is intentionally added to CI.

The separate manual Moodle workflow starts a controlled local Moodle container for selected local suites. It intentionally lets generated seed metadata from `.env` drive local-suite browser runs instead of keeping generated URLs or seeded teacher/student passwords as job-level environment overrides.
