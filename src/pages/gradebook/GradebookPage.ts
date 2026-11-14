import type { Locator } from '@playwright/test';
import type { GradebookCellObservation } from '../../domain/grade-comparison';
import { uiExpect } from '../../support/ui-expect';
import { BasePage } from '../base/BasePage';

export interface StudentGradeExpectation {
  studentId: number | string;
  studentDisplayName: string;
  studentEmail: string;
  assignmentName: string;
  assignmentGradeItemId: number | string;
  // The exact text of the grade cell, for example "82.00".
  grade: string;
}

export class GradebookPage extends BasePage {
  // Opens the grader report by its URL. With an assignment name, its column must be there too.
  async open(gradebookUrl: string, assignmentName?: string): Promise<void> {
    await this.gotoUrl(gradebookUrl);
    await this.dismissTourIfPresent();
    await this.expectGradebookLoaded(assignmentName);
  }

  async dismissTourIfPresent(): Promise<void> {
    const skipTourButton = this.skipTourButton();

    if (await skipTourButton.isVisible()) {
      await skipTourButton.click();
      await this.waitForReady();
    }
  }

  async expectGradebookLoaded(assignmentName?: string): Promise<void> {
    const gradebookRows = this.page.getByRole('rowgroup');

    if (assignmentName) {
      await uiExpect(
        gradebookRows,
        `Expected gradebook to include assignment column "${assignmentName}".`
      ).toContainText(assignmentName);
    }

    await uiExpect(gradebookRows, 'Expected gradebook to include Course total context.').toContainText(/Course total/i);
  }

  async expectStudentGrade(params: StudentGradeExpectation): Promise<void> {
    const studentRow = this.studentRow(params.studentId);

    await uiExpect(
      studentRow,
      `Expected gradebook fixed student row for Moodle user ${params.studentId}.`
    ).toBeVisible();
    await uiExpect(studentRow, 'Expected gradebook row to show the student display name.').toContainText(
      params.studentDisplayName
    );
    await uiExpect(studentRow, 'Expected gradebook row to show the student email.').toContainText(params.studentEmail);
    await uiExpect(
      this.gradeItemHeader(params.assignmentGradeItemId),
      `Expected gradebook column for grade item ${params.assignmentGradeItemId} to be assignment "${params.assignmentName}".`
    ).toContainText(params.assignmentName);
    // toHaveText with a string is an exact match after whitespace normalization, so 182.00 or a
    // matching Course total cannot satisfy it.
    await uiExpect(
      this.studentGradeCell(params.studentId, params.assignmentGradeItemId),
      `Expected "${params.assignmentName}" grade cell for Moodle user ${params.studentId} to equal ${params.grade}.`
    ).toHaveText(params.grade);
  }

  // Reads the places expectStudentGrade() asserts on, each from the element that holds just that value: the
  // name link without its avatar and menu, the email column, the grade item's title link and the grade value.
  async observeStudentGrade(params: StudentGradeExpectation): Promise<GradebookCellObservation> {
    const studentRow = this.studentRow(params.studentId);

    return {
      studentName: await this.readOwnText(studentRow.locator('th a.username').first()),
      studentEmail: await this.readText(studentRow.locator('td[data-col="email"]').first()),
      columnAssignmentName: await this.readText(
        this.gradeItemHeader(params.assignmentGradeItemId).locator('a.gradeitemheader').first()
      ),
      cellText: await this.readText(this.studentGradeCell(params.studentId, params.assignmentGradeItemId))
    };
  }

  private skipTourButton(): Locator {
    return this.page.getByRole('button', { name: /^Skip tour$/i }).first();
  }

  private studentRow(studentId: number | string): Locator {
    return this.page.locator(`#fixed_user_${studentId}`).first();
  }

  // Moodle 5.0 grader report: the item column header and each grade cell carry data-itemid;
  // the displayed grade sits in .gradevalue inside the cell.
  private gradeItemHeader(gradeItemId: number | string): Locator {
    return this.page.locator(`#user-grades th[data-itemid="${gradeItemId}"]`).first();
  }

  private studentGradeCell(studentId: number | string, gradeItemId: number | string): Locator {
    return this.studentRow(studentId).locator(`td[data-itemid="${gradeItemId}"] .gradevalue`);
  }
}
