import type { Locator } from '@playwright/test';
import type { TestEnv } from '../../support/env';
import { resolveGradebookUrl } from '../../support/data-readiness';
import { uiExpect } from '../../support/ui-expect';
import { BasePage } from '../base/BasePage';

interface StudentGradeExpectation {
  studentId: string;
  studentDisplayName: string;
  studentEmail: string;
  assignmentName: string;
  assignmentGradeItemId: string;
  targetGrade: number;
}

export class GradebookPage extends BasePage {
  async openForCourse(courseId: string | number): Promise<void> {
    await this.gotoPath(`/grade/report/grader/index.php?id=${encodeURIComponent(String(courseId))}`);
    await this.dismissTourIfPresent();
  }

  async openControlledGradebook(env: TestEnv): Promise<void> {
    const gradebookUrl = resolveGradebookUrl(env);

    if (gradebookUrl) {
      await this.gotoUrl(gradebookUrl);
    } else if (env.courseId) {
      await this.openForCourse(env.courseId);
    } else {
      throw new Error(
        'Controlled gradebook navigation is not configured. Set MOODLE_GRADEBOOK_URL or MOODLE_COURSE_ID.'
      );
    }

    await this.dismissTourIfPresent();
    await this.expectGradebookLoaded(env.assignmentName);
  }

  async expectTargetGradeForDeterministicStudent(env: TestEnv): Promise<void> {
    await this.expectStudentGrade({
      studentId: env.studentId,
      studentDisplayName: env.studentDisplayName,
      studentEmail: env.studentEmail,
      assignmentName: env.assignmentName,
      assignmentGradeItemId: env.assignmentGradeItemId,
      targetGrade: env.targetGrade
    });
  }

  async dismissTourIfPresent(): Promise<void> {
    const skipTourButton = this.skipTourButton();

    if (await skipTourButton.isVisible()) {
      await skipTourButton.click();
      await this.waitForReady();
    }
  }

  async expectGradebookLoaded(assignmentName: string): Promise<void> {
    const gradebookRows = this.page.getByRole('rowgroup');

    await uiExpect(gradebookRows, `Expected gradebook to include assignment column "${assignmentName}".`).toContainText(
      assignmentName
    );
    await uiExpect(gradebookRows, 'Expected gradebook to include Course total context.').toContainText(/Course total/i);
  }

  async expectStudentGrade(params: StudentGradeExpectation): Promise<void> {
    if (!params.studentId) {
      throw new Error('MOODLE_STUDENT_ID is required for deterministic gradebook row validation.');
    }

    if (!params.studentDisplayName) {
      throw new Error('MOODLE_STUDENT_DISPLAY_NAME is required for deterministic gradebook row validation.');
    }

    if (!params.studentEmail) {
      throw new Error('MOODLE_STUDENT_EMAIL is required for deterministic gradebook row validation.');
    }

    if (!params.assignmentGradeItemId) {
      throw new Error('MOODLE_ASSIGNMENT_GRADE_ITEM_ID is required for deterministic gradebook cell validation.');
    }

    const studentRow = this.studentRow(params.studentId);
    const expectedGrade = this.formattedGrade(params.targetGrade);

    await uiExpect(
      studentRow,
      `Expected gradebook fixed student row for Moodle user ${params.studentId}.`
    ).toBeVisible();
    await uiExpect(studentRow, 'Expected gradebook row to show deterministic student display name.').toContainText(
      params.studentDisplayName
    );
    await uiExpect(studentRow, 'Expected gradebook row to show deterministic student email.').toContainText(
      params.studentEmail
    );
    await uiExpect(
      this.gradeItemHeader(params.assignmentGradeItemId),
      `Expected gradebook column for grade item ${params.assignmentGradeItemId} to be assignment "${params.assignmentName}".`
    ).toContainText(params.assignmentName);
    // toHaveText with a string is an exact match after whitespace normalization, so 182.00 or a
    // matching Course total cannot satisfy it.
    await uiExpect(
      this.studentGradeCell(params.studentId, params.assignmentGradeItemId),
      `Expected "${params.assignmentName}" grade cell for Moodle user ${params.studentId} to equal ${expectedGrade}.`
    ).toHaveText(expectedGrade);
  }

  private skipTourButton(): Locator {
    return this.page.getByRole('button', { name: /^Skip tour$/i }).first();
  }

  private studentRow(studentId: string): Locator {
    return this.page.locator(`#fixed_user_${studentId}`).first();
  }

  // Moodle 5.0 grader report: the item column header and each grade cell carry data-itemid;
  // the displayed grade sits in .gradevalue inside the cell.
  private gradeItemHeader(gradeItemId: string): Locator {
    return this.page.locator(`#user-grades th[data-itemid="${gradeItemId}"]`).first();
  }

  private studentGradeCell(studentId: string, gradeItemId: string): Locator {
    return this.studentRow(studentId).locator(`td[data-itemid="${gradeItemId}"] .gradevalue`);
  }

  private formattedGrade(grade: number): string {
    return Number(grade).toFixed(2);
  }
}
