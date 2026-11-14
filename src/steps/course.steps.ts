import { Then, When } from '@cucumber/cucumber';
import { CoursePage } from '../pages/course/CoursePage';
import { TeacherDashboardPage } from '../pages/dashboard/TeacherDashboardPage';
import type { MoodleWorld } from '../support/custom-world';
import { pendingImplementation } from '../utils/assertions';

When('the teacher opens the Moodle dashboard', async function () {
  pendingImplementation('controlled Moodle selectors not verified yet for teacher dashboard navigation.');
});

// The quoted text is an item of Moodle's main menu, taken from a closed list; each item must open its page.
When('the teacher opens {string} from the dashboard', async function (this: MoodleWorld, menuItem: string) {
  await new TeacherDashboardPage(this.requirePage()).openFromDashboard(menuItem);
});

// Clicks the course where the current page lists it and requires that course's page.
When('the teacher opens course {string}', async function (this: MoodleWorld, courseName: string) {
  const course = this.entities.course(courseName);
  const page = this.requirePage();
  const coursePage = new CoursePage(page);

  await new TeacherDashboardPage(page).openCourse(course.fullName);
  await coursePage.expectCourseContext(course.fullName);
  await coursePage.expectUrlToContain(`/course/view.php?id=${course.id}`);
});

Then('course {string} is available to the teacher', async function (courseName: string) {
  void courseName;
  pendingImplementation('controlled Moodle selectors not verified yet for teacher dashboard course assertion.');
});
