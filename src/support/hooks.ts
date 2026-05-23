import {
  After,
  AfterStep,
  Before,
  BeforeAll,
  BeforeStep,
  Status,
  setDefaultTimeout,
  type ITestCaseHookParameter,
  type ITestStepHookParameter
} from '@cucumber/cucumber';
import * as fs from 'node:fs';
import { attachScreenshotOnFailure } from '../utils/evidence';
import type { MoodleWorld } from './custom-world';

setDefaultTimeout(30000);

const stepStartTimes = new WeakMap<MoodleWorld, number>();

BeforeAll(function () {
  for (const directory of ['reports/cucumber', 'reports/allure-results', 'screenshots', 'videos', 'traces']) {
    fs.mkdirSync(directory, { recursive: true });
  }
});

Before(async function (this: MoodleWorld, scenario: ITestCaseHookParameter) {
  const tags = scenario.pickle.tags.map((tag) => tag.name);

  if (tags.includes('@api') || tags.includes('@wip')) {
    return;
  }

  logScenarioStart(this, scenario);
  await this.initBrowser();
});

BeforeStep(async function (this: MoodleWorld, step: ITestStepHookParameter) {
  stepStartTimes.set(this, Date.now());

  if (this.runtimeProfile.terminalStepsEnabled) {
    console.log(`  -> ${step.pickleStep.text}`);
  }
});

AfterStep(async function (this: MoodleWorld, step: ITestStepHookParameter) {
  const startedAt = stepStartTimes.get(this);
  const elapsedMs = startedAt ? Date.now() - startedAt : 0;
  const status = step.result?.status ?? Status.UNKNOWN;

  if (this.runtimeProfile.terminalStepsEnabled) {
    console.log(`     ${formatTerminalStatus(status)} ${step.pickleStep.text} (${elapsedMs} ms)`);
  }

  if (this.runtimeProfile.stepDelayMs > 0) {
    await delay(this.runtimeProfile.stepDelayMs);
  }
});

function evidenceErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return 'Cucumber evidence attachment failed with a non-Error value.';
}

After(async function (this: MoodleWorld, scenario: ITestCaseHookParameter) {
  const failed = scenario.result?.status === Status.FAILED;
  let evidenceError: unknown;
  const videoPathPromise = this.getVideoPath();

  if (failed && this.page) {
    await attachScreenshotOnFailure(this, scenario.pickle.name, this.page).catch((error: unknown) => {
      evidenceError = evidenceError ?? error;
    });
  }

  const tracePath = await this.stopTracing(scenario.pickle.name, failed).catch((error: unknown) => {
    evidenceError = evidenceError ?? error;
    return undefined;
  });

  if (tracePath) {
    try {
      this.attach(fs.readFileSync(tracePath), { mediaType: 'application/zip', fileName: 'Playwright Trace' });
    } catch (error) {
      evidenceError = evidenceError ?? error;
    }
  }

  await this.closeBrowser();

  const videoPath = await videoPathPromise.catch(() => undefined);

  if (videoPath) {
    await handleVideoEvidence(this, videoPath, failed).catch((error: unknown) => {
      evidenceError = evidenceError ?? error;
    });
  }

  logScenarioEnd(this, scenario, failed);

  if (evidenceError) {
    throw evidenceError instanceof Error ? evidenceError : new Error(evidenceErrorMessage(evidenceError));
  }
});

function logScenarioStart(world: MoodleWorld, scenario: ITestCaseHookParameter): void {
  if (!world.runtimeProfile.terminalStepsEnabled) {
    return;
  }

  const tags = scenario.pickle.tags.map((tag) => tag.name).join(' ');
  console.log('');
  console.log(`[SCENARIO] ${scenario.pickle.name}`);

  if (tags) {
    console.log(`  tags: ${tags}`);
  }
}

function logScenarioEnd(world: MoodleWorld, scenario: ITestCaseHookParameter, failed: boolean): void {
  if (!world.runtimeProfile.terminalStepsEnabled) {
    return;
  }

  const status = failed ? '❌ FAILED' : '✅ PASSED';
  console.log(`${status} Scenario: ${scenario.pickle.name}`);
}

function formatTerminalStatus(status: string): string {
  switch (status) {
    case String(Status.PASSED):
      return '✅ PASS';
    case String(Status.FAILED):
      return '❌ FAIL';
    case String(Status.SKIPPED):
      return '○ SKIPPED';
    case String(Status.PENDING):
      return '○ PENDING';
    case String(Status.UNDEFINED):
      return '○ UNDEFINED';
    default:
      return `○ ${status}`;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileExistsWithBytes(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
  } catch {
    return false;
  }
}

async function handleVideoEvidence(world: MoodleWorld, videoPath: string, failed: boolean): Promise<void> {
  if (!fileExistsWithBytes(videoPath)) {
    return;
  }

  if (world.shouldAttachVideo(failed)) {
    const fileName = world.runtimeProfile.screencastEnabled
      ? failed
        ? 'Screencast Video (Failure)'
        : 'Screencast Video'
      : failed
        ? 'Recorded Failure Video'
        : 'Recorded Video';
    world.attach(fs.readFileSync(videoPath), { mediaType: 'video/webm', fileName });
    return;
  }

  if (world.shouldDiscardVideo(failed)) {
    fs.unlinkSync(videoPath);
  }
}
