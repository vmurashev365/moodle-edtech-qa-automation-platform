import { Given, Then, When } from '@cucumber/cucumber';
import type { MoodleWorld } from '../../support/custom-world';
import { isApiTokenConfigured, missingApiTokenWarning } from '../../support/env';
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

Then(
  'the preflight result should report the API token status consistently with the environment',
  function (this: MoodleWorld) {
    const validation = this.apiPreflight.envValidation;
    assertTrue(validation, 'Expected API preflight validation to be available.');

    // Derived from the raw variable, not from loadEnv(), so a defect in reading, trimming or reporting the
    // token makes the summary, the client and the warning list disagree with the environment.
    const expected = isApiTokenConfigured(process.env.MOODLE_API_TOKEN);
    const statusText = (configured: unknown) => (configured ? 'configured' : 'not configured');

    assertEquals(
      validation.summary.apiTokenConfigured,
      expected,
      `Expected the preflight summary to report the API token as ${statusText(expected)}, ` +
        `but it reported ${statusText(validation.summary.apiTokenConfigured)}.`
    );
    assertEquals(
      this.moodleClient.apiTokenConfigured,
      expected,
      `Expected MoodleClient to treat the API token as ${statusText(expected)}.`
    );
    assertEquals(
      validation.warnings.includes(missingApiTokenWarning),
      !expected,
      expected
        ? 'Expected no missing-token warning when MOODLE_API_TOKEN is configured.'
        : 'Expected a missing-token warning when MOODLE_API_TOKEN is not configured.'
    );
  }
);
