import { Then } from '@cucumber/cucumber';
import type { MoodleWorld } from '../../support/custom-world';
import { assertIncludes } from '../../utils/assertions';

Then('the current page title should include {string}', async function (this: MoodleWorld, expectedTitle: string) {
  const page = this.requirePage();
  const actualTitle = await page.title();
  assertIncludes(actualTitle, expectedTitle);
});
