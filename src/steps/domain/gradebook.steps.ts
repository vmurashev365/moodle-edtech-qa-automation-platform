import { Given, Then, When } from '@cucumber/cucumber';
import { GradebookPage } from '../../pages/gradebook/GradebookPage';
import type { MoodleWorld } from '../../support/custom-world';
import { pendingImplementation } from '../../utils/assertions';

Given(
  'student {string} has grade {string} for {string}',
  async function (username: string, grade: string, assignmentName: string) {
    void username;
    void grade;
    void assignmentName;
    pendingImplementation('controlled Moodle grade seed or API validation helper is not implemented yet.');
  }
);

When('the teacher opens the gradebook for {string}', async function (courseName: string) {
  void courseName;
  pendingImplementation('controlled Moodle selectors not verified yet for gradebook navigation.');
});

Then('the gradebook shows {string} for student {string}', async function (grade: string, username: string) {
  void grade;
  void username;
  pendingImplementation('controlled Moodle selectors not verified yet for gradebook grade assertion.');
});

Then('the assignment grade and gradebook grade are reconciled for student {string}', async function (username: string) {
  void username;
  pendingImplementation('assignment and gradebook API/UI reconciliation is pending controlled Moodle setup.');
});

When('I open the controlled gradebook', async function (this: MoodleWorld) {
  const gradebookPage = new GradebookPage(this.requirePage());
  await gradebookPage.openControlledGradebook(this.env);
});

Then('the gradebook should show the target grade for the deterministic student', async function (this: MoodleWorld) {
  const gradebookPage = new GradebookPage(this.requirePage());
  await gradebookPage.expectTargetGradeForDeterministicStudent(this.env);
});
