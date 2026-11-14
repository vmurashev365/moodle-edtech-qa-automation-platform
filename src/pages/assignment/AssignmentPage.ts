import type { Locator } from '@playwright/test';
import type { GradingRequestResponse } from '../../domain/access-comparison';
import type { SubmissionObservation } from '../../domain/grade-comparison';
import { uiExpect } from '../../support/ui-expect';
import { BasePage } from '../base/BasePage';

// Mission 5 Recorder evidence shows this Moodle semantic container owns submission status facts. In Moodle 5.0 it
// holds one element per fact: .submissionstatus<status>, .submissionnotgraded or .submissiongraded, and the
// submission plugins' content.
const submissionStatusPanelSelector = '.submissionstatustable';
const studentInfoSelector = '[data-region="user-info"]';
// Moodle's fatal error box (core_renderer::fatal_error), rendered when a page throws before any output.
const fatalErrorSelector = '[data-rel="fatalerror"]';

// Who the single-user grading interface must show.
export interface StudentIdentity {
  id: number | string;
  displayName: string;
  email: string;
}

export interface GradingServiceRequest {
  cmid: number;
  assignmentInstanceId: number;
  userId: number;
  grade: number;
}

// What a refused grading page shows, for comparison evidence.
export interface GradingRefusalPageObservation {
  errorMessage: string | null;
  errorDocumentationHref: string | null;
  gradeInputCount: number;
  saveButtonCount: number;
}

export class AssignmentPage extends BasePage {
  // Clicks the assignment where the current page lists it, for example on the course page.
  async openAssignmentFromCoursePage(assignmentName: string): Promise<void> {
    const assignmentLink = this.assignmentLink(assignmentName);

    await uiExpect(
      assignmentLink,
      `Expected assignment "${assignmentName}" to be listed on this page; open its course first.`
    ).toBeVisible();
    await assignmentLink.click();
    await this.waitForReady();
    await this.expectAssignmentContext(assignmentName);
  }

  // Mission 5: the assignment page's Grade action opens Moodle's single-user grading interface
  // (action=grader) at the first participant.
  async openGradingInterfaceFromAssignmentPage(): Promise<void> {
    const gradeAction = this.gradeAction();

    await uiExpect(gradeAction, 'Expected the assignment Grade action to be visible.').toBeVisible();
    await gradeAction.click();
    await this.waitForReady();
    await this.expectUrlToContain('action=grader');
  }

  // Opens Moodle's single-user grading interface for one student's submission by its URL.
  async openSingleUserGrading(gradingUrl: string, student: StudentIdentity): Promise<void> {
    await this.gotoUrl(gradingUrl);
    await this.expectUrlToContain('action=grader');
    await this.expectUrlToContain(`userid=${student.id}`);
  }

  // Opens the single-user grading interface without expecting grader content, for users who must be refused.
  // Returns the HTTP status of the final response.
  async attemptSingleUserGrading(gradingUrl: string): Promise<number> {
    const response = await this.page.goto(gradingUrl);
    await this.waitForReady();

    if (!response) {
      throw new Error(`Opening ${gradingUrl} returned no HTTP response.`);
    }

    return response.status();
  }

  // The page is Moodle's capability error on the grading URL of this student's submission; see
  // refusedGradingPageError for why the error reads "error/nopermission".
  async expectSingleUserGradingDenied(
    student: StudentIdentity,
    error: { message: string; documentationPath: string }
  ): Promise<void> {
    await this.expectUrlToContain('action=grader');
    await this.expectUrlToContain(`userid=${student.id}`);
    await uiExpect(
      this.fatalError(),
      'Expected Moodle to refuse the single-user grading interface with its permission error.'
    ).toBeVisible();
    await uiExpect(
      this.fatalErrorMessage(),
      `Expected the Moodle error to be the "${error.message}" capability error.`
    ).toHaveText(error.message);
    await uiExpect(
      this.fatalErrorDocumentationLink(),
      `Expected the Moodle error documentation link to point to ${error.documentationPath}.`
    ).toHaveAttribute('href', new RegExp(`${this.escapeForRegExp(error.documentationPath)}$`));
  }

  // Absence checks also pass on a page that has not rendered, so call this only after a positive anchor such as
  // expectSingleUserGradingDenied().
  async expectNoGradingControls(): Promise<void> {
    await uiExpect(this.gradeInput(), 'Expected no Moodle "Grade out of" input.').toHaveCount(0);
    await uiExpect(this.saveChangesButton(), 'Expected no Moodle "Save changes" action.').toHaveCount(0);
  }

  async observeGradingRefusal(): Promise<GradingRefusalPageObservation> {
    return {
      errorMessage: await this.readText(this.fatalErrorMessage()),
      errorDocumentationHref: await this.readAttribute(this.fatalErrorDocumentationLink(), 'href'),
      gradeInputCount: await this.gradeInput().count(),
      saveButtonCount: await this.saveChangesButton().count()
    };
  }

  // Sends, from the current page with the signed-in user's session key, the request the single-user grading panel
  // sends on "Save changes" (mod/assign/amd/src/grading_panel.js): mod_assign_submit_grading_form through
  // lib/ajax/service.php. assignmentid is the assign instance id, not the cmid; jsonformdata is the grade form,
  // URL-encoded and then JSON-encoded, with the fields the panel serialises.
  async submitGradeThroughGradingService(request: GradingServiceRequest): Promise<GradingRequestResponse> {
    return this.page.evaluate(async ({ cmid, assignmentInstanceId, userId, grade }) => {
      const moodleConfig = (window as unknown as { M?: { cfg?: { sesskey?: string; wwwroot?: string } } }).M?.cfg;

      if (!moodleConfig?.sesskey || !moodleConfig.wwwroot) {
        throw new Error('The current page exposes no Moodle session key (M.cfg.sesskey); sign in first.');
      }

      const formData = new URLSearchParams({
        id: String(cmid),
        rownum: '0',
        useridlistid: '',
        attemptnumber: '-1',
        ajax: '0',
        userid: '0',
        sendstudentnotifications: 'false',
        action: 'submitgrade',
        sesskey: moodleConfig.sesskey,
        [`_qf__mod_assign_grade_form_${userId}`]: '1',
        grade: String(grade),
        'assignfeedbackcomments_editor[text]': '',
        'assignfeedbackcomments_editor[format]': '1',
        'assignfeedbackcomments_editor[itemid]': '0'
      }).toString();
      const serviceUrl = new URL(`${moodleConfig.wwwroot.replace(/\/$/, '')}/lib/ajax/service.php`);
      serviceUrl.searchParams.set('sesskey', moodleConfig.sesskey);
      serviceUrl.searchParams.set('info', 'mod_assign_submit_grading_form');

      const response = await fetch(serviceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          {
            index: 0,
            methodname: 'mod_assign_submit_grading_form',
            args: { assignmentid: assignmentInstanceId, userid: userId, jsonformdata: JSON.stringify(formData) }
          }
        ])
      });
      const text = await response.text();
      let body: unknown;

      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = text;
      }

      return { httpStatus: response.status, body };
    }, request);
  }

  // The grading interface shows this student's submitted, not yet graded work with the text they handed in.
  async expectSubmissionReadyForGrading(student: StudentIdentity, submissionText: string): Promise<void> {
    await this.expectStudentVisible(student);
    await this.expectSubmissionStatusReadyForGrading(submissionText);
  }

  async observeSubmission(): Promise<SubmissionObservation> {
    const studentInfo = this.page.locator(studentInfoSelector).first();
    const statusPanel = this.submissionStatusPanel();

    return {
      studentName: await this.readOwnText(studentInfo.locator('h4 a').first()),
      studentEmail: await this.readText(studentInfo.locator('small').first()),
      submissionStatus: await this.readText(statusPanel.locator('> div[class^="submissionstatus"]').first()),
      gradingStatus: await this.readText(statusPanel.locator('> div[class*="graded"]').first()),
      submissionText: await this.readText(statusPanel.locator('.assignsubmission_onlinetext .no-overflow').first())
    };
  }

  // Enters the grade for the student shown in the single-user grading interface and saves it.
  async gradeSubmission(student: StudentIdentity, submissionText: string, grade: number): Promise<void> {
    await this.expectSubmissionReadyForGrading(student, submissionText);
    await this.expectCurrentGradeIsNot(grade);

    const gradeInput = this.gradeInput();
    const saveButton = this.saveChangesButton();

    await uiExpect(gradeInput, 'Expected Moodle grade input to be visible.').toBeVisible();
    await gradeInput.fill(String(grade));
    await saveButton.scrollIntoViewIfNeeded();
    await uiExpect(saveButton, 'Expected Moodle Save changes button to be visible.').toBeVisible();
    await saveButton.click();
    await this.waitForReady();

    await this.expectNoVisibleValidationErrors();
    await this.expectSavedCurrentGrade(grade);
  }

  private async expectAssignmentContext(assignmentName: string): Promise<void> {
    const heading = this.page.getByRole('heading', { name: this.textMatcher(assignmentName) }).first();

    await uiExpect(heading, `Expected the assignment page heading to show "${assignmentName}".`).toBeVisible();
    await this.expectGradingSummaryVisible();
  }

  private async expectGradingSummaryVisible(): Promise<void> {
    const mainRegion = this.page.getByRole('main').first();
    const summaryRows = this.page.getByRole('rowgroup');

    await uiExpect(mainRegion, 'Expected the assignment page to show the grading summary.').toContainText(
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

  private async expectStudentVisible(student: StudentIdentity): Promise<void> {
    const studentPanel = this.studentInfoPanel(student.displayName);

    await uiExpect(
      studentPanel,
      `Expected single-user grading interface to show student "${student.displayName}".`
    ).toBeVisible();
    await uiExpect(studentPanel, `Expected single-user grading interface to show "${student.email}".`).toContainText(
      student.email
    );
  }

  private async expectSubmissionStatusReadyForGrading(submissionText: string): Promise<void> {
    const statusPanel = this.submissionStatusPanel();

    await uiExpect(statusPanel, 'Expected Moodle submission status panel to be visible.').toBeVisible();
    await uiExpect(statusPanel, 'Expected submitted-for-grading status.').toContainText(/Submitted for grading/i);
    await uiExpect(statusPanel, 'Expected not-graded status.').toContainText(/Not graded/i);
    await uiExpect(statusPanel, 'Expected the submitted text in the Moodle submission status panel.').toContainText(
      submissionText
    );
  }

  // A grade that is already there would make the save prove nothing.
  private async expectCurrentGradeIsNot(grade: number): Promise<void> {
    const currentValue = await this.gradeInput().inputValue();
    const currentGrade = this.parseGrade(currentValue);

    if (currentGrade === grade) {
      throw new Error(
        `The grade is already ${grade} before the teacher enters it, so saving it would not prove a grade write.`
      );
    }
  }

  private async expectSavedCurrentGrade(grade: number): Promise<void> {
    const expectedGrade = this.formattedGrade(grade);

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
    return this.page.locator(studentInfoSelector).filter({ hasText: studentDisplayName }).first();
  }

  private submissionStatusPanel(): Locator {
    return this.page.locator(submissionStatusPanelSelector).first();
  }

  private fatalError(): Locator {
    return this.page.locator(fatalErrorSelector).first();
  }

  private fatalErrorMessage(): Locator {
    return this.fatalError().locator('.errormessage');
  }

  private fatalErrorDocumentationLink(): Locator {
    return this.fatalError().getByRole('link', { name: 'More information about this error' });
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
