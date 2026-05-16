import { courseSelectors } from '../../ui-map/course.selectors';
import { BasePage } from '../base/BasePage';

export class CoursePage extends BasePage {
  async openCourse(courseName: string): Promise<void> {
    void courseName;
    void courseSelectors;
    this.pendingSelectors('course navigation');
  }

  async expectAssignmentVisible(assignmentName: string): Promise<void> {
    void assignmentName;
    this.pendingSelectors('assignment visibility in course');
  }
}
