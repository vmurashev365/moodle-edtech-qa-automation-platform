import { Given, Then, When } from '@cucumber/cucumber';
import type { MoodleWorld } from '../../support/custom-world';
import { assertEquals, assertTrue } from '../../utils/assertions';
import { attachJson } from '../../utils/evidence';

Given('the controlled Moodle environment configuration is loaded', async function (this: MoodleWorld) {
  const validation = this.moodleClient.validateConfiguration();
  this.apiPreflight.envValidation = validation;
  await attachJson(this, 'Controlled Moodle environment summary', validation.summary);
});

When('I validate the Moodle API preflight contract', async function (this: MoodleWorld) {
  const validation = this.moodleClient.validateConfiguration();
  this.apiPreflight.envValidation = validation;
  await attachJson(this, 'Controlled Moodle API preflight validation', validation);
});

Then('the preflight result should confirm the base URL and controlled data names', function (this: MoodleWorld) {
  const validation = this.apiPreflight.envValidation;
  assertTrue(validation, 'Expected API preflight validation to be available.');
  assertEquals(validation.ok, true, validation.errors.join('\n'));
  assertTrue(validation.summary.baseUrl, 'Expected a configured Moodle base URL.');
  assertTrue(validation.summary.courseName, 'Expected a configured controlled course name.');
  assertTrue(validation.summary.assignmentName, 'Expected a configured controlled assignment name.');
});

Then('the preflight result should report API token configuration status', function (this: MoodleWorld) {
  const validation = this.apiPreflight.envValidation;
  assertTrue(validation, 'Expected API preflight validation to be available.');
  assertTrue(
    typeof validation.summary.apiTokenConfigured === 'boolean',
    'Expected API token configuration status to be reported.'
  );
});
