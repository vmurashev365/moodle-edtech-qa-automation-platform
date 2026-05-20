import type { TestEnv } from '../../support/env';
import {
  resolveAssignmentSubmissionsUrl,
  resolveAssignmentUrl,
  studentSubmissionSearchTerms
} from '../../support/data-readiness';
import { uiExpect } from '../../support/ui-expect';
import { assignmentLegacySelectors } from '../../ui-map/assignment.selectors';
import { BasePage } from '../base/BasePage';

const deterministicSubmissionText =
  'This is a deterministic QA automation strategy submission for the Moodle EdTech demo.';

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
    const assignmentLink = this.page.getByRole('link', { name: this.textMatcher(assignmentName) }).first();

    await uiExpect(
      assignmentLink,
      `Expected assignment link "${assignmentName}" to be visible before navigation.`
    ).toBeVisible();
    await assignmentLink.click();
    await this.waitForReady();
  }

  async openSubmissions(env: TestEnv): Promise<void> {
    const submissionsUrl = resolveAssignmentSubmissionsUrl(env);

    if (submissionsUrl) {
      await this.gotoUrl(submissionsUrl);
      return;
    }

    const accessibleAction = this.page
      .getByRole('link', { name: /view all submissions|submissions|grade/i })
      .or(this.page.getByRole('button', { name: /view all submissions|submissions|grade/i }));
    const legacyAction = this.page
      .locator(assignmentLegacySelectors.assignmentPage.submissionsAction)
      .filter({ hasText: /view all submissions|submissions|grade/i });
    const submissionsAction = accessibleAction.or(legacyAction).first();

    await uiExpect(submissionsAction, 'Expected an assignment submissions action to be visible.').toBeVisible();
    await submissionsAction.click();
    await this.waitForReady();
  }

  async expectDeterministicSubmissionVisible(env: TestEnv): Promise<void> {
    const searchTerms = [...studentSubmissionSearchTerms(env), deterministicSubmissionText];
    const searchPattern = new RegExp(searchTerms.map((term) => this.escapeForRegExp(term)).join('|'), 'i');
    const studentRow = this.page.getByRole('row').filter({ hasText: searchPattern });
    const deterministicSubmission = this.page.getByText(deterministicSubmissionText, { exact: false });
    const legacySubmissionsTable = this.page
      .locator(assignmentLegacySelectors.assignmentPage.submissionsTable)
      .filter({ hasText: searchPattern });
    const visibleSubmissionContract = studentRow.or(deterministicSubmission).or(legacySubmissionsTable).first();

    await uiExpect(
      visibleSubmissionContract,
      `Expected deterministic student submission to be visible using one of: ${searchTerms.join(', ')}.`
    ).toBeVisible();
  }

  async gradeSubmission(username: string, grade: string): Promise<void> {
    void username;
    void grade;
    this.pendingSelectors('teacher grading workflow');
  }

  async gradeDeterministicSubmissionWithTargetGrade(env: TestEnv): Promise<void> {
    void env;
    this.pendingSelectors(
      'Phase 6 teacher grading workflow. Controlled Moodle seed data and grading selectors must be verified before removing @wip.'
    );
  }

  private async expectAssignmentContext(assignmentName: string): Promise<void> {
    const heading = this.page.getByRole('heading', { name: this.textMatcher(assignmentName) });
    const title = this.page
      .locator(assignmentLegacySelectors.assignmentPage.assignmentTitle)
      .filter({ hasText: this.textMatcher(assignmentName) });
    const mainRegion = this.page
      .locator(assignmentLegacySelectors.assignmentPage.mainRegion)
      .filter({ hasText: this.textMatcher(assignmentName) });
    const assignmentContext = heading.or(title).or(mainRegion).first();

    await uiExpect(assignmentContext, `Expected controlled assignment page to show "${assignmentName}".`).toBeVisible();
  }
}
