import { After, Before, BeforeAll, Status, type ITestCaseHookParameter } from '@cucumber/cucumber';
import * as fs from 'node:fs';
import { attachScreenshotOnFailure } from '../utils/evidence';
import type { MoodleWorld } from './custom-world';

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

After(async function (this: MoodleWorld, scenario: ITestCaseHookParameter) {
  if (scenario.result?.status === Status.FAILED && this.page) {
    await attachScreenshotOnFailure(this, scenario.pickle.name, this.page);
  }

  await this.closeBrowser();
});
