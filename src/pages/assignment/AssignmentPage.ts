import type { Locator } from '@playwright/test';
import type { TestEnv } from '../../support/env';
import { resolveAssignmentGradingUrl, resolveAssignmentUrl } from '../../support/data-readiness';
import { uiExpect } from '../../support/ui-expect';
import { BasePage } from '../base/BasePage';

const deterministicSubmissionText =
  'This is a deterministic QA automation strategy submission for the Moodle EdTech demo.';
// Mission 5 Recorder evidence shows this Moodle semantic container owns submission status facts.
const moodleSubmissionStatusPanelSelector = '.submissionstatustable';

export class AssignmentPage extends BasePage {
  async openControlledAssignment(env: TestEnv): Promise<void> {
    const assignmentUrl = resolveAssignmentUrl(env);

    if (assignmentUrl) {
      await this.gotoUrl(assignmentUrl);
    } else {
      await this.openAssignment(env.assignmentName);
    }

    await this.expectAssignmentContext(env.assignmentName);
  }

  async openAssignment(assignmentName: string): Promise<void> {
    const assignmentLink = this.assignmentLink(assignmentName);

    await uiExpect(
      assignmentLink,
      `Expected assignment link "${assignmentName}" to be visible before navigation.`
    ).toBeVisible();
    await assignmentLink.click();
    await this.waitForReady();
  }

  async openControlledAssignmentFromCoursePage(env: TestEnv): Promise<void> {
    await this.openAssignment(env.assignmentName);
    await this.expectAssignmentContext(env.assignmentName);
  }

  // Mission 5: the assignment page's Grade action opens Moodle's single-user grading interface
  // (action=grader) at the first participant; the controlled assignment has one student.
  async openGradingInterfaceFromAssignmentPage(): Promise<void> {
    const gradeAction = this.gradeAction();

    await uiExpect(gradeAction, 'Expected the controlled assignment Grade action to be visible.').toBeVisible();
    await gradeAction.click();
    await this.waitForReady();
    await this.expectUrlToContain('action=grader');
  }

  async openGradingInterface(env: TestEnv): Promise<void> {
    const gradingUrl = resolveAssignmentGradingUrl(env);

    if (gradingUrl) {
      await this.gotoUrl(gradingUrl);
    } else {
      await this.openGradingInterfaceFromAssignmentPage();
    }

    await this.expectUrlToContain('action=grader');

    if (env.studentId) {
      await this.expectUrlToContain(`userid=${env.studentId}`);
    }
  }

  async expectDeterministicSubmissionVisible(env: TestEnv): Promise<void> {
    await this.expectDeterministicStudentVisible(env);
    await this.expectSubmissionReadyForGrading();
  }

  async gradeSubmission(username: string, grade: string): Promise<void> {
    void username;
    void grade;
    this.pendingSelectors('teacher grading workflow');
  }

  async gradeDeterministicSubmissionWithTargetGrade(env: TestEnv): Promise<void> {
    await this.expectDeterministicStudentVisible(env);
    await this.expectSubmissionReadyForGrading();
    await this.expectCurrentGradeIsNotTarget(env.targetGrade);

    const gradeInput = this.gradeInput();
    const saveButton = this.saveChangesButton();

    await uiExpect(gradeInput, 'Expected Moodle grade input to be visible.').toBeVisible();
    await gradeInput.fill(String(env.targetGrade));
    await saveButton.scrollIntoViewIfNeeded();
    await uiExpect(saveButton, 'Expected Moodle Save changes button to be visible.').toBeVisible();
    await saveButton.click();
    await this.waitForReady();

    await this.expectNoVisibleValidationErrors();
    await this.expectSavedCurrentGrade(env.targetGrade);
  }

  private async expectAssignmentContext(assignmentName: string): Promise<void> {
    const heading = this.page.getByRole('heading', { name: this.textMatcher(assignmentName) }).first();

    await uiExpect(heading, `Expected controlled assignment page heading to show "${assignmentName}".`).toBeVisible();
    await this.expectGradingSummaryVisible();
  }

  private async expectGradingSummaryVisible(): Promise<void> {
    const mainRegion = this.page.getByRole('main').first();
    const summaryRows = this.page.getByRole('rowgroup');

    await uiExpect(mainRegion, 'Expected controlled assignment page to show the grading summary.').toContainText(
      'Grading summary'
    );
    await uiExpect(summaryRows, 'Expected grading summary to include participant count.').toContainText('Participants');
    await uiExpect(summaryRows, 'Expected grading summary to include submitted count.').toContainText('Submitted');
    await uiExpect(summaryRows, 'Expected grading summary to include needs grading count.').toContainText(
      'Needs grading'
    );
  }

  private gradeAction(): Locator {
    return this.page.getByRole('link', { name: /^Grade$/i }).first();
  }

  private async expectDeterministicStudentVisible(env: TestEnv): Promise<void> {
    if (!env.studentDisplayName) {
      throw new Error('MOODLE_STUDENT_DISPLAY_NAME is required to assert the deterministic student identity.');
    }

    if (!env.studentEmail) {
      throw new Error('MOODLE_STUDENT_EMAIL is required to assert the deterministic student identity.');
    }

    const studentPanel = this.studentInfoPanel(env.studentDisplayName);

    await uiExpect(
      studentPanel,
      `Expected single-user grading interface to show student "${env.studentDisplayName}".`
    ).toBeVisible();
    await uiExpect(studentPanel, `Expected single-user grading interface to show "${env.studentEmail}".`).toContainText(
      env.studentEmail
    );
  }

  private async expectSubmissionReadyForGrading(): Promise<void> {
    const statusPanel = this.submissionStatusPanel();

    await uiExpect(statusPanel, 'Expected Moodle submission status panel to be visible.').toBeVisible();
    await uiExpect(statusPanel, 'Expected submitted-for-grading status.').toContainText(/Submitted for grading/i);
    await uiExpect(statusPanel, 'Expected not-graded status.').toContainText(/Not graded/i);
    await uiExpect(
      statusPanel,
      'Expected deterministic submission text in the Moodle submission status panel.'
    ).toContainText(deterministicSubmissionText);
  }

  private async expectCurrentGradeIsNotTarget(targetGrade: number): Promise<void> {
    const currentValue = await this.gradeInput().inputValue();
    const currentGrade = this.parseGrade(currentValue);

    if (currentGrade === targetGrade) {
      throw new Error(
        `Controlled grading baseline is already ${targetGrade}. Run npm run moodle:seed:ready so the UI scenario proves a real grade write.`
      );
    }
  }

  private async expectSavedCurrentGrade(targetGrade: number): Promise<void> {
    const expectedGrade = this.formattedGrade(targetGrade);

    await uiExpect(this.currentGradeInGradebook(), 'Expected Moodle current grade value to be visible.').toBeVisible();
    // toHaveText with a string is an exact match after whitespace normalization, so 182.00 or 82.001
    // cannot satisfy it.
    await uiExpect(
      this.currentGradeInGradebook(),
      `Expected current grade in gradebook to equal saved UI grade ${expectedGrade}.`
    ).toHaveText(expectedGrade);
  }

  private async expectNoVisibleValidationErrors(): Promise<void> {
    await uiExpect(
      this.visibleValidationErrors(),
      'Expected Moodle grading form to have no visible validation errors.'
    ).toHaveCount(0);
  }

  private studentInfoPanel(studentDisplayName: string): Locator {
    return this.page.locator('[data-region="user-info"]').filter({ hasText: studentDisplayName }).first();
  }

  private submissionStatusPanel(): Locator {
    return this.page.locator(moodleSubmissionStatusPanelSelector).first();
  }

  private gradeInput(): Locator {
    return this.page.getByRole('textbox', { name: /Grade out of/i }).first();
  }

  private saveChangesButton(): Locator {
    return this.page.getByRole('button', { name: /^Save changes$/i }).first();
  }

  // Moodle 5.0 grading form: the static "Current grade in gradebook" field renders only the value
  // (a gradebook link reading "82.00" or "Not graded") in .currentgrade, apart from the field label.
  private currentGradeInGradebook(): Locator {
    return this.page.locator('#fitem_id_currentgrade [data-name="currentgrade"] .currentgrade').first();
  }

  private visibleValidationErrors(): Locator {
    return this.page
      .locator('.invalid-feedback:visible, .form-control-feedback:visible, .alert-danger:visible')
      .filter({ hasText: /\S/ });
  }

  private formattedGrade(grade: number): string {
    return Number(grade).toFixed(2);
  }

  private parseGrade(value: string): number | undefined {
    const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/);

    if (!match) {
      return undefined;
    }

    const parsed = Number.parseFloat(match[0]);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private assignmentLink(assignmentName: string): Locator {
    return this.page.getByRole('link', { name: this.assignmentLinkNameMatcher(assignmentName) }).first();
  }

  private assignmentLinkNameMatcher(assignmentName: string): RegExp {
    return new RegExp(`${this.escapeForRegExp(assignmentName)}(?:\\s+Assignment)?`, 'i');
  }
}
