import { assignmentSelectors } from '../../ui-map/assignment.selectors';
import { BasePage } from '../base/BasePage';

export class AssignmentPage extends BasePage {
  async openAssignment(assignmentName: string): Promise<void> {
    void assignmentName;
    void assignmentSelectors;
    this.pendingSelectors('assignment page navigation');
  }

  async openSubmissions(assignmentName: string): Promise<void> {
    void assignmentName;
    this.pendingSelectors('assignment submissions navigation');
  }

  async expectSubmissionVisible(username: string): Promise<void> {
    void username;
    this.pendingSelectors('student submission visibility');
  }

  async gradeSubmission(username: string, grade: string): Promise<void> {
    void username;
    void grade;
    this.pendingSelectors('teacher grading workflow');
  }
}
