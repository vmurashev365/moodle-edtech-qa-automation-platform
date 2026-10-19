import { Then, When } from '@cucumber/cucumber';
import { CoursePage } from '../../pages/course/CoursePage';
import { TeacherDashboardPage } from '../../pages/dashboard/TeacherDashboardPage';
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

When('I open My courses from the dashboard', async function (this: MoodleWorld) {
  const dashboardPage = new TeacherDashboardPage(this.requirePage());
  await dashboardPage.openMyCoursesFromDashboard();
});

When('I open the controlled course from My courses', async function (this: MoodleWorld) {
  const page = this.requirePage();
  await new TeacherDashboardPage(page).openCourse(this.env.courseName);
  await new CoursePage(page).expectCourseContext(this.env.courseName);
});

Then('course {string} is available to the teacher', async function (courseName: string) {
  void courseName;
  pendingImplementation('controlled Moodle selectors not verified yet for teacher dashboard course assertion.');
});
