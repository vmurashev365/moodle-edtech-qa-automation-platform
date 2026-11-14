import { Then, When } from '@cucumber/cucumber';
import { pendingImplementation } from '../utils/assertions';

When('the student opens audio resource {string}', async function (resourceName: string) {
  void resourceName;
  pendingImplementation('controlled Moodle selectors not verified yet for audio resource navigation.');
});

Then('audio controls are visible for the student', async function () {
  pendingImplementation('controlled Moodle selectors not verified yet for audio controls assertion.');
});
