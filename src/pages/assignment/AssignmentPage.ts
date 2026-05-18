import type { TestEnv } from '../../support/env';
import {
  resolveAssignmentSubmissionsUrl,
  resolveAssignmentUrl,
  studentSubmissionSearchTerms
} from '../../support/data-readiness';
import { assignmentSelectors } from '../../ui-map/assignment.selectors';
import { assertTrue } from '../../utils/assertions';
import { BasePage } from '../base/BasePage';

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
    const assignmentLink = this.page.getByRole('link', { name: new RegExp(assignmentName, 'i') }).first();
    const visible = await assignmentLink.isVisible({ timeout: 10000 }).catch(() => false);

    assertTrue(visible, `Expected assignment link "${assignmentName}" to be visible before navigation.`);
    await assignmentLink.click();
    await this.waitForReady();
  }

  async openSubmissions(env: TestEnv): Promise<void> {
    const submissionsAction = this.page
      .locator(assignmentSelectors.assignmentPage.submissionsAction)
      .filter({ hasText: /view all submissions|submissions|grade/i })
      .first();
    const accessibleAction = this.page
      .getByRole('link', { name: /view all submissions|submissions|grade/i })
      .or(this.page.getByRole('button', { name: /view all submissions|submissions|grade/i }))
      .first();

    if (await accessibleAction.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accessibleAction.click();
      await this.waitForReady();
      return;
    }

    if (await submissionsAction.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submissionsAction.click();
      await this.waitForReady();
      return;
    }

    const submissionsUrl = resolveAssignmentSubmissionsUrl(env);

    if (!submissionsUrl) {
      throw new Error(
        'Assignment submissions navigation is not available. Set MOODLE_ASSIGNMENT_SUBMISSIONS_URL or MOODLE_ASSIGNMENT_ID after manual seed.'
      );
    }

    await this.gotoUrl(submissionsUrl);
  }

  async expectDeterministicSubmissionVisible(env: TestEnv): Promise<void> {
    const searchTerms = studentSubmissionSearchTerms(env);

    for (const term of searchTerms) {
      const visible = await this.page.getByText(term, { exact: false }).first().isVisible({ timeout: 5000 }).catch(() => false);

      if (visible) {
        return;
      }
    }

    const tableText = (await this.page.locator(assignmentSelectors.assignmentPage.submissionsTable).first().textContent().catch(() => ''))?.trim();

    throw new Error(
      `Expected deterministic student submission to be visible using one of: ${searchTerms.join(', ')}. ` +
        `Current submissions table text sample: ${(tableText ?? '').slice(0, 300)}`
    );
  }

  async gradeSubmission(username: string, grade: string): Promise<void> {
    void username;
    void grade;
    this.pendingSelectors('teacher grading workflow');
  }

  private async expectAssignmentContext(assignmentName: string): Promise<void> {
    const title = this.page
      .locator(assignmentSelectors.assignmentPage.assignmentTitle)
      .filter({ hasText: assignmentName })
      .first();
    const mainRegion = this.page
      .locator(assignmentSelectors.assignmentPage.mainRegion)
      .filter({ hasText: assignmentName })
      .first();

    const visible =
      (await title.isVisible({ timeout: 10000 }).catch(() => false)) ||
      (await mainRegion.isVisible({ timeout: 2000 }).catch(() => false));

    assertTrue(visible, `Expected controlled assignment page to show "${assignmentName}".`);
  }
}
