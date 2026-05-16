import { Given, Then, When } from '@cucumber/cucumber';
import { pendingImplementation } from '../../utils/assertions';

Given('the controlled course has a submitted assignment ready for grading', async function () {
  pendingImplementation('controlled Moodle seed data and submission setup are not implemented yet.');
});

When('the teacher opens assignment {string}', async function (assignmentName: string) {
  void assignmentName;
  pendingImplementation('controlled Moodle selectors not verified yet for assignment navigation.');
});

When('the teacher opens assignment submissions for {string}', async function (assignmentName: string) {
  void assignmentName;
  pendingImplementation('controlled Moodle selectors not verified yet for assignment submissions navigation.');
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
