import { Given } from '@cucumber/cucumber';
import { Then, When } from '@cucumber/cucumber';
import { pendingImplementation } from '../../utils/assertions';

Given('teacher {string} is signed in', async function (username: string) {
  void username;
  pendingImplementation('controlled Moodle selectors not verified yet for teacher sign-in.');
});

Given('student {string} is signed in', async function (username: string) {
  void username;
  pendingImplementation('controlled Moodle selectors not verified yet for student sign-in.');
});

When('the student attempts to open teacher-only grading for {string}', async function (assignmentName: string) {
  void assignmentName;
  pendingImplementation('teacher-only grading URL and permission boundary are not verified yet.');
});

Then('access to teacher grading is denied', async function () {
  pendingImplementation('controlled Moodle permission denial assertion is not implemented yet.');
});
