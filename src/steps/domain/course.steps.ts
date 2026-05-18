import { Then, When } from '@cucumber/cucumber';
import { CoursePage } from '../../pages/course/CoursePage';
import type { MoodleWorld } from '../../support/custom-world';
import { pendingImplementation } from '../../utils/assertions';

When('the teacher opens the Moodle dashboard', async function () {
  pendingImplementation('controlled Moodle selectors not verified yet for teacher dashboard navigation.');
});

When('the teacher opens course {string}', async function (courseName: string) {
  void courseName;
  pendingImplementation('controlled Moodle selectors not verified yet for course navigation.');
});

When('I open the controlled course', async function (this: MoodleWorld) {
  const coursePage = new CoursePage(this.requirePage());
  await coursePage.openControlledCourse(this.env);
});

Then('course {string} is available to the teacher', async function (courseName: string) {
  void courseName;
  pendingImplementation('controlled Moodle selectors not verified yet for teacher dashboard course assertion.');
});
