import { dashboardSelectors } from '../../ui-map/dashboard.selectors';
import { BasePage } from '../base/BasePage';

export class TeacherDashboardPage extends BasePage {
  async open(): Promise<void> {
    this.pendingSelectors('teacher dashboard navigation');
  }

  async expectCourseVisible(courseName: string): Promise<void> {
    void courseName;
    void dashboardSelectors;
    this.pendingSelectors('teacher dashboard course visibility');
  }
}
