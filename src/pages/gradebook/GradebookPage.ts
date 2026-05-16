import { gradebookSelectors } from '../../ui-map/gradebook.selectors';
import { BasePage } from '../base/BasePage';

export class GradebookPage extends BasePage {
  async open(courseName: string): Promise<void> {
    void courseName;
    void gradebookSelectors;
    this.pendingSelectors('gradebook navigation');
  }

  async expectStudentGrade(username: string, grade: string): Promise<void> {
    void username;
    void grade;
    this.pendingSelectors('gradebook student grade assertion');
  }
}
