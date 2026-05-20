import type { TestEnv } from '../../support/env';
import { resolveGradebookUrl } from '../../support/data-readiness';
import { gradebookLegacySelectors } from '../../ui-map/gradebook.selectors';
import { BasePage } from '../base/BasePage';

export class GradebookPage extends BasePage {
  async open(courseName: string): Promise<void> {
    void courseName;
    void gradebookLegacySelectors;
    this.pendingSelectors('gradebook navigation');
  }

  async expectStudentGrade(username: string, grade: string): Promise<void> {
    void username;
    void grade;
    this.pendingSelectors('gradebook student grade assertion');
  }

  async openControlledGradebook(env: TestEnv): Promise<void> {
    const gradebookUrl = resolveGradebookUrl(env);

    if (!gradebookUrl) {
      throw new Error(
        'Controlled gradebook navigation is not configured. Set MOODLE_GRADEBOOK_URL or MOODLE_COURSE_ID.'
      );
    }

    void gradebookLegacySelectors;
    await this.gotoUrl(gradebookUrl);
  }

  async expectTargetGradeForDeterministicStudent(env: TestEnv): Promise<void> {
    void env;
    void gradebookLegacySelectors;
    this.pendingSelectors(
      'Phase 6 gradebook grade assertion. Controlled gradebook selectors must be verified before removing @wip.'
    );
  }
}
