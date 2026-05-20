import type { TestEnv } from '../../support/env';
import {
  resolveAssignmentSubmissionsUrl,
  resolveAssignmentUrl,
  studentSubmissionSearchTerms
} from '../../support/data-readiness';
import { assignmentSelectors } from '../../ui-map/assignment.selectors';
import { assertTrue } from '../../utils/assertions';
import { BasePage } from '../base/BasePage';

const deterministicSubmissionText = 'This is a deterministic QA automation strategy submission for the Moodle EdTech demo.';

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
    const searchTerms = [...studentSubmissionSearchTerms(env), deterministicSubmissionText];
    const foundInRenderedText = await this.page
      .waitForFunction((terms) => terms.some((term) => document.body.innerText.includes(term)), searchTerms, { timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    if (foundInRenderedText) {
      return;
    }

    const bodyText = (await this.page.locator('body').textContent({ timeout: 1000 }).catch(() => ''))?.trim() ?? '';

    if (searchTerms.some((term) => bodyText.includes(term))) {
      return;
    }

    for (const term of searchTerms) {
      const matches = this.page.getByText(term, { exact: false });
      const count = await matches.count().catch(() => 0);

      for (let index = 0; index < Math.min(count, 10); index += 1) {
        const visible = await matches.nth(index).isVisible({ timeout: 500 }).catch(() => false);

        if (visible) {
          return;
        }
      }
    }

    const tableText = (
      await this.page
        .locator(assignmentSelectors.assignmentPage.submissionsTable)
        .first()
        .textContent({ timeout: 1000 })
        .catch(() => '')
    )?.trim();

    throw new Error(
      `Expected deterministic student submission to be visible using one of: ${searchTerms.join(', ')}. ` +
        `Current page text sample: ${bodyText.slice(0, 300)} ` +
        `Current submissions table text sample: ${(tableText ?? '').slice(0, 300)}`
    );
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
