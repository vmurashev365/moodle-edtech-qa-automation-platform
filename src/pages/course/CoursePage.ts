import type { TestEnv } from '../../support/env';
import { resolveCourseUrl } from '../../support/data-readiness';
import { uiExpect } from '../../support/ui-expect';
import { courseLegacySelectors } from '../../ui-map/course.selectors';
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
    const courseLink = this.page.getByRole('link', { name: this.textMatcher(courseName) }).first();

    await uiExpect(courseLink, `Expected course link "${courseName}" to be visible before navigation.`).toBeVisible();
    await courseLink.click();
    await this.waitForReady();
  }

  async expectAssignmentVisible(assignmentName: string): Promise<void> {
    const accessibleAssignment = this.page.getByRole('link', { name: this.textMatcher(assignmentName) });
    const legacyAssignment = this.page
      .locator(courseLegacySelectors.coursePage.assignmentLink)
      .filter({ hasText: this.textMatcher(assignmentName) });
    const assignment = accessibleAssignment.or(legacyAssignment).first();

    await uiExpect(
      assignment,
      `Expected controlled assignment "${assignmentName}" to be visible in the course.`
    ).toBeVisible();
  }

  private async expectCourseContext(courseName: string): Promise<void> {
    const heading = this.page.getByRole('heading', { name: this.textMatcher(courseName) });
    const legacyTitle = this.page
      .locator(courseLegacySelectors.coursePage.courseTitle)
      .filter({ hasText: this.textMatcher(courseName) });
    const mainRegion = this.page
      .locator(courseLegacySelectors.coursePage.mainRegion)
      .filter({ hasText: this.textMatcher(courseName) });
    const courseContext = heading.or(legacyTitle).or(mainRegion).first();

    await uiExpect(courseContext, `Expected controlled course page to show "${courseName}".`).toBeVisible();
  }
}
