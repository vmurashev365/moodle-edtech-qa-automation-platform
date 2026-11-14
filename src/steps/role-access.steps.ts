import { Then, When } from '@cucumber/cucumber';
import {
  compareGradingPageRefusal,
  compareGradingRequestRefusal,
  readGradingRequestResult,
  refusedGradingPageError
} from '../domain/access-comparison';
import { assertComparison } from '../domain/comparison';
import { compareStillNotGraded, parseGradeEntry } from '../domain/grade-comparison';
import { AssignmentPage } from '../pages/assignment/AssignmentPage';
import { LoginPage } from '../pages/auth/LoginPage';
import type { MoodleWorld } from '../support/custom-world';
import { expectGradebookReadable, readGradeStateFor } from '../support/grade-state';
import { attachComparison, attachJson, verifyWithComparison } from '../utils/evidence';

// Opens the single-user grading page of the submission in focus as the signed-in student and keeps the HTTP
// status of the answer.
When('the student tries to open the grading page for that submission', async function (this: MoodleWorld) {
  const { student, assignment } = this.requireSubmissionInFocus();
  const assignmentPage = new AssignmentPage(this.requirePage());

  this.roleAccess.gradingPageStatus = await assignmentPage.attemptSingleUserGrading(
    this.entities.gradingUrl(assignment, student)
  );
});

// In order: the page is not the login page and the user menu still belongs to the signed-in user (a
// signed-out or different user also lacks grading controls); Moodle shows its permission error on the
// grading URL; only then may the grading controls and the login form be absent.
Then('Moodle refuses with a permission error', async function (this: MoodleWorld) {
  const httpStatus = this.roleAccess.gradingPageStatus;

  if (httpStatus === undefined) {
    throw new Error('No attempt to open the grading page was recorded before checking the refusal.');
  }

  const { student } = this.requireSubmissionInFocus();
  const signedIn = this.requireSignedIn();
  const page = this.requirePage();
  const loginPage = new LoginPage(page);
  const assignmentPage = new AssignmentPage(page);

  await verifyWithComparison(
    this,
    'Comparison: grading page is refused',
    async () => {
      loginPage.expectNotOnLoginPage();
      await loginPage.expectSignedInAs(signedIn.displayName);
      await assignmentPage.expectSingleUserGradingDenied(student, refusedGradingPageError);
      // Absence checks run only after the permission error above proved the page rendered.
      await assignmentPage.expectNoGradingControls();
      await loginPage.expectLoginFormAbsent();
    },
    async () =>
      compareGradingPageRefusal(
        {
          httpStatus,
          onLoginPage: loginPage.isOnLoginPage(),
          signedInUserName: await loginPage.readSignedInUserName(),
          ...(await assignmentPage.observeGradingRefusal())
        },
        signedIn.displayName
      )
  );
});

// Sends, from the student's page and with the student's session key, the request the grading page sends on
// Save changes, for the submission in focus.
When(
  'the student sends the grading request for that submission with grade {string}',
  async function (this: MoodleWorld, gradeText: string) {
    const { assignment, stateBefore } = this.requireSubmissionInFocus();
    const grade = parseGradeEntry(gradeText, assignment.maxGrade);
    const assignmentPage = new AssignmentPage(this.requirePage());
    // The ids Moodle itself reported for this submission, as the grading page would send them.
    const response = await assignmentPage.submitGradeThroughGradingService({
      cmid: stateBefore.cmid,
      assignmentInstanceId: stateBefore.assignmentInstanceId,
      userId: stateBefore.studentId,
      grade
    });

    await attachJson(this, 'Moodle grading service response', response);
    this.roleAccess.gradingRequestResponse = response;
  }
);

Then('Moodle refuses with a permission error for grading', async function (this: MoodleWorld) {
  const response = this.roleAccess.gradingRequestResponse;

  if (!response) {
    throw new Error('No grading request was recorded before checking the refusal.');
  }

  const comparison = compareGradingRequestRefusal(response);
  const result = readGradingRequestResult(response);
  const raw = JSON.stringify(response.body);

  await attachComparison(this, 'Comparison: grading request is refused', comparison);

  // The two ways a request can fail to prove the permission boundary get their own explanation.
  if (!result.errorReported && result.warningCount > 0) {
    throw new Error(
      'Moodle returned warnings instead of a permission error, so the grade form did not validate and the ' +
        `capability check never ran: ${raw}.`
    );
  }

  if (!result.errorReported && result.resultCount === 1) {
    throw new Error(`Expected Moodle to reject the student's grade submission, but it accepted it: ${raw}.`);
  }

  assertComparison(comparison);
});

// After the refused attempt Moodle's own records must hold no grade, and the stored value must be the very
// value read before the attempt.
Then('the submission from student {string} is still not graded', async function (this: MoodleWorld, username: string) {
  const { student, assignment, stateBefore } = this.requireSubmissionOf(username);
  const stateAfter = readGradeStateFor({ assignmentCmid: assignment.cmid, studentId: student.id });
  const comparison = compareStillNotGraded(stateBefore, stateAfter);

  await attachJson(this, 'Moodle backend grade state after the attempt (CLI)', stateAfter);
  await attachComparison(this, 'Comparison: submission is still not graded', comparison);
  expectGradebookReadable(stateAfter);
  assertComparison(comparison);
});
