import { Given, When } from '@cucumber/cucumber';
import { BasePage } from '../../pages/base/BasePage';
import type { MoodleWorld } from '../../support/custom-world';

Given('I navigate to the Moodle base URL', async function (this: MoodleWorld) {
  const basePage = new BasePage(this.requirePage());
  await basePage.goto(this.env.baseUrl);
});

When('I open the Moodle path {string}', async function (this: MoodleWorld, path: string) {
  const basePage = new BasePage(this.requirePage());
  const safePath = path.startsWith('/') ? path : `/${path}`;
  await basePage.goto(safePath);
});
