import { Given, Then, When } from '@cucumber/cucumber';
import { LoginPage } from '../../pages/auth/LoginPage';
import type { MoodleWorld } from '../../support/custom-world';
import { pendingImplementation } from '../../utils/assertions';

Given('teacher {string} is signed in', async function (username: string) {
  void username;
  pendingImplementation('controlled Moodle selectors not verified yet for teacher sign-in.');
});

Given('student {string} is signed in', async function (username: string) {
  void username;
  pendingImplementation('controlled Moodle selectors not verified yet for student sign-in.');
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

When('the student attempts to open teacher-only grading for {string}', async function (assignmentName: string) {
  void assignmentName;
  pendingImplementation('teacher-only grading URL and permission boundary are not verified yet.');
});

Then('access to teacher grading is denied', async function () {
  pendingImplementation('controlled Moodle permission denial assertion is not implemented yet.');
});
