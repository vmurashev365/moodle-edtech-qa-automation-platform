import { Given, Then, When } from '@cucumber/cucumber';
import { LoginPage } from '../../pages/auth/LoginPage';
import type { MoodleWorld } from '../../support/custom-world';
import { pendingImplementation } from '../../utils/assertions';

Given('teacher {string} is signed in', async function (username: string) {
  void username;
  pendingImplementation('controlled Moodle selectors not verified yet for teacher sign-in.');
});

Given('student {string} is signed in', async function (this: MoodleWorld, username: string) {
  if (username !== this.env.studentUsername) {
    throw new Error(
      `The step names student "${username}", but the controlled student is MOODLE_STUDENT_USERNAME="${this.env.studentUsername}".`
    );
  }

  if (!this.env.studentDisplayName) {
    throw new Error(
      'MOODLE_STUDENT_DISPLAY_NAME is required to confirm the signed-in student. Run npm run moodle:seed:ready.'
    );
  }

  const loginPage = new LoginPage(this.requirePage());
  await loginPage.signInAs('student', this.env);
  await loginPage.expectSignedInAs(this.env.studentDisplayName);
});

Given('the controlled Moodle instance is available', async function (this: MoodleWorld) {
  const response = await fetch(this.env.baseUrl, {
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`Controlled Moodle is not reachable at ${this.env.baseUrl}; status ${response.status}.`);
  }
});

When('I open the Moodle login page', async function (this: MoodleWorld) {
  const loginPage = new LoginPage(this.requirePage());
  await loginPage.open();
});

When('I log in as the configured teacher user', async function (this: MoodleWorld) {
  const loginPage = new LoginPage(this.requirePage());
  await loginPage.signInAs('teacher', this.env);
});

Then('the Moodle login form should be visible', async function (this: MoodleWorld) {
  const loginPage = new LoginPage(this.requirePage());
  await loginPage.expectLoginFormVisible();
});
