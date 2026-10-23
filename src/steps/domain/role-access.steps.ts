import { Then, When } from '@cucumber/cucumber';
import { AssignmentPage } from '../../pages/assignment/AssignmentPage';
import { LoginPage } from '../../pages/auth/LoginPage';
import type { MoodleWorld } from '../../support/custom-world';
import type { TestEnv } from '../../support/env';
import { attachJson } from '../../utils/evidence';

// core_renderer::fatal_error sends 404 for an error raised before page output when the request carries no Range
// header, which is the case for the capability check at the top of the grading page.
const deniedGraderStatus = 404;

function requireControlledAssignment(assignmentName: string, env: TestEnv): void {
  if (assignmentName !== env.assignmentName) {
    throw new Error(
      `The step names assignment "${assignmentName}", but the controlled assignment is MOODLE_ASSIGNMENT_NAME="${env.assignmentName}".`
    );
  }
}

When(
  'the student attempts to open teacher-only grading for {string}',
  async function (this: MoodleWorld, assignmentName: string) {
    requireControlledAssignment(assignmentName, this.env);

    const assignmentPage = new AssignmentPage(this.requirePage());
    this.roleAccess.graderResponseStatus = await assignmentPage.attemptSingleUserGrading(this.env);
  }
);

Then('access to teacher grading is denied', async function (this: MoodleWorld) {
  const status = this.roleAccess.graderResponseStatus;

  if (status === undefined) {
    throw new Error('No teacher grading attempt was recorded before checking the denial.');
  }

  const page = this.requirePage();
  const loginPage = new LoginPage(page);
  const assignmentPage = new AssignmentPage(page);

  await attachJson(this, 'Teacher grading access attempt', { url: page.url(), status });

  // Identity first: a signed-out or wrong user also lacks grading controls, so neither may read as a denial.
  loginPage.expectNotOnLoginPage();
  await loginPage.expectSignedInAs(this.env.studentDisplayName);
  await assignmentPage.expectSingleUserGradingDenied(this.env);

  if (status !== deniedGraderStatus) {
    throw new Error(
      `Expected Moodle to answer the refused grading request with HTTP ${deniedGraderStatus}, but it returned ${status}.`
    );
  }

  // Absence checks run only after the permission error above proved the page rendered.
  await assignmentPage.expectNoGradingControls();
  await loginPage.expectLoginFormAbsent();
});
