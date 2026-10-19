import { Given, Then, When } from '@cucumber/cucumber';
import { AssignmentPage } from '../../pages/assignment/AssignmentPage';
import type { MoodleWorld } from '../../support/custom-world';
import { validateControlledDataReadiness, validateControlledGradingReadiness } from '../../support/data-readiness';
import { pendingImplementation } from '../../utils/assertions';

Given('the controlled course has a submitted assignment ready for grading', async function () {
  pendingImplementation('controlled Moodle seed data and submission setup are not implemented yet.');
});

Given('controlled Moodle test data exists', async function (this: MoodleWorld) {
  const readiness = validateControlledDataReadiness(this.env);

  if (!readiness.ok) {
    throw new Error(
      `Controlled Moodle test data is not ready for Phase 5: ${readiness.errors.join(' ')} ` +
        'Run npm run moodle:seed:ready, then confirm the required .env IDs or URLs are present.'
    );
  }
});

Given('controlled Moodle grading test data exists', async function (this: MoodleWorld) {
  const readiness = validateControlledGradingReadiness(this.env);

  if (!readiness.ok) {
    throw new Error(
      `Controlled Moodle grading data is not ready for Phase 6: ${readiness.errors.join(' ')} ` +
        'Run npm run moodle:seed:ready before the local grading workflow.'
    );
  }
});

When('the teacher opens assignment {string}', async function (assignmentName: string) {
  void assignmentName;
  pendingImplementation('controlled Moodle selectors not verified yet for assignment navigation.');
});

When('I open the controlled assignment', async function (this: MoodleWorld) {
  const assignmentPage = new AssignmentPage(this.requirePage());
  await assignmentPage.openControlledAssignment(this.env);
});

When('the teacher opens assignment submissions for {string}', async function (assignmentName: string) {
  void assignmentName;
  pendingImplementation('controlled Moodle selectors not verified yet for assignment submissions navigation.');
});

When('I open the controlled assignment from the course page', async function (this: MoodleWorld) {
  const assignmentPage = new AssignmentPage(this.requirePage());
  await assignmentPage.openControlledAssignmentFromCoursePage(this.env);
});

When('I open the grading interface from the assignment page', async function (this: MoodleWorld) {
  const assignmentPage = new AssignmentPage(this.requirePage());
  await assignmentPage.openGradingInterfaceFromAssignmentPage();
});

When('I open the controlled assignment grading interface', async function (this: MoodleWorld) {
  const assignmentPage = new AssignmentPage(this.requirePage());
  await assignmentPage.openGradingInterface(this.env);
  await assignmentPage.expectDeterministicSubmissionVisible(this.env);
});

When('I grade the deterministic student submission with the target grade', async function (this: MoodleWorld) {
  const assignmentPage = new AssignmentPage(this.requirePage());
  await assignmentPage.gradeDeterministicSubmissionWithTargetGrade(this.env);
});

When('the teacher grades the deterministic submission as {string}', async function (grade: string) {
  void grade;
  pendingImplementation('controlled Moodle grading selectors and grade save flow are not verified yet.');
});

Then('assignment {string} is available in the course', async function (assignmentName: string) {
  void assignmentName;
  pendingImplementation('controlled Moodle selectors not verified yet for assignment visibility assertion.');
});

Then('the submission from student {string} is visible to the teacher', async function (username: string) {
  void username;
  pendingImplementation('controlled Moodle selectors not verified yet for submission visibility assertion.');
});

Then('I should see the deterministic student submission', async function (this: MoodleWorld) {
  const assignmentPage = new AssignmentPage(this.requirePage());
  await assignmentPage.expectDeterministicSubmissionVisible(this.env);
});
