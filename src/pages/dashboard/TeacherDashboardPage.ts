import { dashboardSelectors } from '../../ui-map/dashboard.selectors';
import { assertTrue } from '../../utils/assertions';
import { BasePage } from '../base/BasePage';

export class TeacherDashboardPage extends BasePage {
  async open(): Promise<void> {
    await this.gotoPath('/my/');
    await this.waitForReady();
  }

  async expectCourseVisible(courseName: string): Promise<void> {
    const courseLink = this.page
      .locator(dashboardSelectors.dashboardPage.courseLink)
      .filter({ hasText: courseName })
      .first();
    const visible = await courseLink.isVisible({ timeout: 10000 }).catch(() => false);

    assertTrue(visible, `Expected teacher dashboard to show controlled course "${courseName}".`);
  }
}
