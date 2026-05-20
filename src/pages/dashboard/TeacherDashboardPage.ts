import { uiExpect } from '../../support/ui-expect';
import { dashboardLegacySelectors } from '../../ui-map/dashboard.selectors';
import { BasePage } from '../base/BasePage';

export class TeacherDashboardPage extends BasePage {
  async open(): Promise<void> {
    await this.gotoPath('/my/');
    await this.waitForReady();
  }

  async expectCourseVisible(courseName: string): Promise<void> {
    const accessibleCourse = this.page.getByRole('link', { name: this.textMatcher(courseName) });
    const legacyCourse = this.page
      .locator(dashboardLegacySelectors.dashboardPage.courseLink)
      .filter({ hasText: this.textMatcher(courseName) });
    const courseLink = accessibleCourse.or(legacyCourse).first();

    await uiExpect(courseLink, `Expected teacher dashboard to show controlled course "${courseName}".`).toBeVisible();
  }
}
