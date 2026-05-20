import { Then } from '@cucumber/cucumber';
import { BasePage } from '../../pages/base/BasePage';
import type { MoodleWorld } from '../../support/custom-world';

Then('the current page title should include {string}', async function (this: MoodleWorld, expectedTitle: string) {
  const basePage = new BasePage(this.requirePage());
  await basePage.expectTitleToContain(expectedTitle);
});
