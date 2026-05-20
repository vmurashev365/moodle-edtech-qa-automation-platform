import { After, Before, BeforeAll, Status, setDefaultTimeout, type ITestCaseHookParameter } from '@cucumber/cucumber';
import * as fs from 'node:fs';
import { attachScreenshotOnFailure } from '../utils/evidence';
import type { MoodleWorld } from './custom-world';

setDefaultTimeout(30000);

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

  await this.initBrowser();
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
      this.attach(fs.readFileSync(tracePath), 'application/zip');
    } catch (error) {
      evidenceError = evidenceError ?? error;
    }
  }

  await this.closeBrowser();

  if (evidenceError) {
    throw evidenceError instanceof Error ? evidenceError : new Error(evidenceErrorMessage(evidenceError));
  }
});
