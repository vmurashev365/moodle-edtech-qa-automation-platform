import { Given, When } from '@cucumber/cucumber';
import type { MoodleWorld } from '../../support/custom-world';

Given('I navigate to the Moodle base URL', async function (this: MoodleWorld) {
  const page = this.requirePage();
  await page.goto(this.env.baseUrl);
});

When('I open the Moodle path {string}', async function (this: MoodleWorld, path: string) {
  const page = this.requirePage();
  const safePath = path.startsWith('/') ? path : `/${path}`;
  await page.goto(safePath);
});
