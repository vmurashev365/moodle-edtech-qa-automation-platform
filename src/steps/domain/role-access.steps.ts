import { Then, When } from '@cucumber/cucumber';
import { AssignmentPage } from '../../pages/assignment/AssignmentPage';
import { LoginPage } from '../../pages/auth/LoginPage';
import type { MoodleWorld } from '../../support/custom-world';
import type { TestEnv } from '../../support/env';
import { expectGradeStateUnchanged, expectNotGraded, readGradeState } from '../../support/grade-state';
import { attachJson } from '../../utils/evidence';

// core_renderer::fatal_error sends 404 for an error raised before page output when the request carries no Range
// header, which is the case for the capability check at the top of the grading page.
const deniedGraderStatus = 404;

// mod_assign_submit_grading_form validates the grade form first and calls assign::save_grade() only for valid data;
// save_grade() starts with require_capability('mod/assign:grade'), whose English name is "Grade assignment". A
// malformed request fails differently (a "couldnotsavegrade" warning or another errorcode), so only this exact error
// proves the permission boundary.
const gradingPermissionError = {
  errorcode: 'nopermissions',
  message: 'Sorry, but you do not currently have permissions to do that (Grade assignment).'
};

interface ServiceCallResult {
  error?: unknown;
  data?: unknown;
  exception?: { errorcode?: unknown; message?: unknown };
}

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

When(
  "the student attempts to submit a grade for {string} through Moodle's grading service",
  async function (this: MoodleWorld, assignmentName: string) {
    requireControlledAssignment(assignmentName, this.env);

    const before = readGradeState(this.env);
    await attachJson(this, 'Moodle backend grade state before the grading attempt (CLI)', before);
    // An unchanged grade proves nothing if it already equals the grade the attempt submits.
    expectNotGraded(before);
    this.roleAccess.gradeStateBefore = before;

    const assignmentPage = new AssignmentPage(this.requirePage());
    const response = await assignmentPage.submitGradeThroughGradingService({
      cmid: before.cmid,
      assignmentInstanceId: before.assignmentInstanceId,
      userId: before.studentId,
      grade: this.env.targetGrade
    });
    await attachJson(this, 'Moodle grading service response', response);
    this.roleAccess.gradingServiceResponse = response;
  }
);

Then('Moodle rejects the grade submission for lack of grading permission', async function (this: MoodleWorld) {
  const response = this.roleAccess.gradingServiceResponse;

  if (!response) {
    throw new Error('No grading service attempt was recorded before checking the rejection.');
  }

  const raw = JSON.stringify(response.body);

  if (response.httpStatus !== 200 || !Array.isArray(response.body) || response.body.length !== 1) {
    throw new Error(
      `Expected one Moodle AJAX result with HTTP 200, but got HTTP ${response.httpStatus} with body ${raw}.`
    );
  }

  const result = response.body[0] as ServiceCallResult;

  if (result.error !== true && Array.isArray(result.data) && result.data.length > 0) {
    throw new Error(
      'Moodle returned warnings instead of a permission error, so the grade form did not validate and the ' +
        `capability check never ran: ${raw}.`
    );
  }

  if (result.error !== true) {
    throw new Error(`Expected Moodle to reject the student's grade submission, but it accepted it: ${raw}.`);
  }

  const errorcode = result.exception?.errorcode;
  const message = result.exception?.message;

  if (errorcode !== gradingPermissionError.errorcode) {
    throw new Error(
      `Moodle rejected the grade submission, but not as a permission error: errorcode ${String(errorcode)} ` +
        `("${String(message)}"), expected ${gradingPermissionError.errorcode}.`
    );
  }

  if (message !== gradingPermissionError.message) {
    throw new Error(
      `Moodle refused permission, but not for the grading capability mod/assign:grade: "${String(message)}", ` +
        `expected "${gradingPermissionError.message}".`
    );
  }
});

Then('the deterministic student grade is still not graded in Moodle', async function (this: MoodleWorld) {
  const before = this.roleAccess.gradeStateBefore;

  if (!before) {
    throw new Error('No grade state was recorded before the grading attempt.');
  }

  const after = readGradeState(this.env);
  await attachJson(this, 'Moodle backend grade state after the grading attempt (CLI)', after);
  expectNotGraded(after);
  expectGradeStateUnchanged(before, after);
});
