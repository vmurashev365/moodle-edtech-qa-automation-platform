import { Given, Then, When } from '@cucumber/cucumber';
import { assertComparison } from '../domain/comparison';
import { compareSubmissionReadyForGrading, compareUngradedBaseline, parseGradeEntry } from '../domain/grade-comparison';
import { AssignmentPage } from '../pages/assignment/AssignmentPage';
import type { MoodleWorld } from '../support/custom-world';
import { expectGradebookReadable, readGradeStateFor } from '../support/grade-state';
import { resetUngradedBaseline } from '../support/ungraded-baseline';
import { pendingImplementation } from '../utils/assertions';
import { attachComparison, attachJson, verifyWithComparison } from '../utils/evidence';

// Establishes which submission the scenario is about and puts it into its starting state: the grade is reset
// to "not graded" through Moodle's grading API, then read back from Moodle's own records and compared. The
// read fails if the student has no submission. A scenario therefore owns its starting state and passes in
// any order and on repeated runs.
Given(
  'student {string} has an ungraded submission for {string}',
  async function (this: MoodleWorld, username: string, assignmentName: string) {
    const student = this.entities.student(username);
    const assignment = this.entities.assignment(assignmentName);
    const submission = this.entities.submission(assignment, student);
    const target = { assignmentCmid: assignment.cmid, studentId: student.id };

    resetUngradedBaseline(target);

    const state = readGradeStateFor(target);
    const comparison = compareUngradedBaseline(state);

    await attachJson(this, 'Moodle backend grade state before the scenario acts (CLI)', state);
    await attachComparison(this, 'Comparison: submission is not graded yet', comparison);
    expectGradebookReadable(state);
    assertComparison(comparison);

    this.submissionInFocus = { student, assignment, text: submission.text, stateBefore: state };
  }
);

// Clicks the assignment where the current page lists it and requires that assignment's page.
When('the teacher opens assignment {string}', async function (this: MoodleWorld, assignmentName: string) {
  const assignment = this.entities.assignment(assignmentName);
  const assignmentPage = new AssignmentPage(this.requirePage());

  await assignmentPage.openAssignmentFromCoursePage(assignment.name);
  await assignmentPage.expectUrlToContain(`/mod/assign/view.php?id=${assignment.cmid}`);
});

When('the teacher opens assignment submissions for {string}', async function (assignmentName: string) {
  void assignmentName;
  pendingImplementation('controlled Moodle selectors not verified yet for assignment submissions navigation.');
});

// The assignment page's Grade action, which opens Moodle's single-user grading interface.
When('the teacher opens grading for the assignment', async function (this: MoodleWorld) {
  await new AssignmentPage(this.requirePage()).openGradingInterfaceFromAssignmentPage();
});

// Opens Moodle's single-user grading interface for the submission in focus, enters the grade and saves it.
// The grading page must show this student's submitted, ungraded work first, and the grade must not already
// be the one being entered, so the save is a real write.
When(
  'the teacher grades the submission from student {string} as {string}',
  async function (this: MoodleWorld, username: string, gradeText: string) {
    const { student, assignment, text } = this.requireSubmissionOf(username);
    const grade = parseGradeEntry(gradeText, assignment.maxGrade);
    const assignmentPage = new AssignmentPage(this.requirePage());

    await assignmentPage.openSingleUserGrading(this.entities.gradingUrl(assignment, student), student);
    await assignmentPage.gradeSubmission(student, text, grade);
  }
);

Then('assignment {string} is available in the course', async function (assignmentName: string) {
  void assignmentName;
  pendingImplementation('controlled Moodle selectors not verified yet for assignment visibility assertion.');
});

Then('the submission from student {string} is visible to the teacher', async function (username: string) {
  void username;
  pendingImplementation('controlled Moodle selectors not verified yet for submission visibility assertion.');
});

// On the grading page the teacher has open: the student's identity, both statuses and the submitted text.
Then(
  'the teacher sees the submission from student {string} as submitted and not graded',
  async function (this: MoodleWorld, username: string) {
    const { student, text } = this.requireSubmissionOf(username);
    const assignmentPage = new AssignmentPage(this.requirePage());

    await verifyWithComparison(
      this,
      'Comparison: submission shown on the grading page',
      () => assignmentPage.expectSubmissionReadyForGrading(student, text),
      async () =>
        compareSubmissionReadyForGrading(await assignmentPage.observeSubmission(), {
          studentDisplayName: student.displayName,
          studentEmail: student.email,
          submissionText: text
        })
    );
  }
);
