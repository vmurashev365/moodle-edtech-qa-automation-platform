import type { TestEnv } from '../../support/env';
import { resolveCourseUrl } from '../../support/data-readiness';
import { courseSelectors } from '../../ui-map/course.selectors';
import { assertTrue } from '../../utils/assertions';
import { BasePage } from '../base/BasePage';

export class CoursePage extends BasePage {
  async openControlledCourse(env: TestEnv): Promise<void> {
    const courseUrl = resolveCourseUrl(env);

    if (!courseUrl) {
      throw new Error('Controlled course navigation is not configured. Set MOODLE_COURSE_ID or MOODLE_COURSE_URL.');
    }

    await this.gotoUrl(courseUrl);
    await this.expectCourseContext(env.courseName);
  }

  async openCourse(courseName: string): Promise<void> {
    const courseLink = this.page.getByRole('link', { name: new RegExp(courseName, 'i') }).first();
    const visible = await courseLink.isVisible({ timeout: 10000 }).catch(() => false);

    assertTrue(visible, `Expected course link "${courseName}" to be visible before navigation.`);
    await courseLink.click();
    await this.waitForReady();
  }

  async expectAssignmentVisible(assignmentName: string): Promise<void> {
    const assignmentLink = this.page
      .locator(courseSelectors.coursePage.assignmentLink)
      .filter({ hasText: assignmentName })
      .first();
    const accessibleAssignment = this.page.getByRole('link', { name: new RegExp(assignmentName, 'i') }).first();

    const visible =
      (await assignmentLink.isVisible({ timeout: 10000 }).catch(() => false)) ||
      (await accessibleAssignment.isVisible({ timeout: 2000 }).catch(() => false));

    assertTrue(visible, `Expected controlled assignment "${assignmentName}" to be visible in the course.`);
  }

  private async expectCourseContext(courseName: string): Promise<void> {
    const title = this.page.locator(courseSelectors.coursePage.courseTitle).filter({ hasText: courseName }).first();
    const mainRegion = this.page.locator(courseSelectors.coursePage.mainRegion).filter({ hasText: courseName }).first();

    const visible =
      (await title.isVisible({ timeout: 10000 }).catch(() => false)) ||
      (await mainRegion.isVisible({ timeout: 2000 }).catch(() => false));

    assertTrue(visible, `Expected controlled course page to show "${courseName}".`);
  }
}
