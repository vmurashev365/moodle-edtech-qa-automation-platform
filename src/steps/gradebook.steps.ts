import { Given, Then, When } from '@cucumber/cucumber';
import { assertComparison } from '../domain/comparison';
import { compareGradebookCell, compareStoredGrade, parseGradeEntry } from '../domain/grade-comparison';
import { GradebookPage, type StudentGradeExpectation } from '../pages/gradebook/GradebookPage';
import type { MoodleWorld } from '../support/custom-world';
import { expectGradebookReadable, readGradeStateFor } from '../support/grade-state';
import { pendingImplementation } from '../utils/assertions';
import { attachComparison, attachJson, verifyWithComparison } from '../utils/evidence';

Given(
  'student {string} has grade {string} for {string}',
  async function (username: string, grade: string, assignmentName: string) {
    void username;
    void grade;
    void assignmentName;
    pendingImplementation('controlled Moodle grade seed or API validation helper is not implemented yet.');
  }
);

When('the teacher opens the gradebook for {string}', async function (this: MoodleWorld, courseName: string) {
  const course = this.entities.course(courseName);
  const assignment = this.submissionInFocus?.assignment;

  if (assignment && assignment.course.id !== course.id) {
    throw new Error(
      `Assignment "${assignment.name}" belongs to course "${assignment.course.fullName}", not to "${courseName}".`
    );
  }

  await new GradebookPage(this.requirePage()).open(course.gradebookUrl, assignment?.name);
});

// The grade is the exact text of the cell where the student's row meets the column of the assignment in focus.
Then(
  'the gradebook shows {string} for student {string}',
  async function (this: MoodleWorld, grade: string, username: string) {
    const { assignment } = this.requireSubmissionInFocus();
    const student = this.entities.student(username);
    const gradebookPage = new GradebookPage(this.requirePage());
    const expectation: StudentGradeExpectation = {
      studentId: student.id,
      studentDisplayName: student.displayName,
      studentEmail: student.email,
      assignmentName: assignment.name,
      assignmentGradeItemId: assignment.gradeItemId,
      grade
    };

    await verifyWithComparison(
      this,
      'Comparison: grade shown in the gradebook',
      () => gradebookPage.expectStudentGrade(expectation),
      async () => compareGradebookCell(await gradebookPage.observeStudentGrade(expectation), expectation)
    );
  }
);

// Backend reconciliation through the Moodle CLI (not Web Services): the grade written in the UI must be the
// grade Moodle stores for the assignment and in the gradebook.
Then(
  'the grade recorded for student {string} is {string} in both the assignment and the gradebook',
  async function (this: MoodleWorld, username: string, gradeText: string) {
    const { assignment } = this.requireSubmissionInFocus();
    const student = this.entities.student(username);
    const expectedGrade = parseGradeEntry(gradeText, assignment.maxGrade);
    const state = readGradeStateFor({ assignmentCmid: assignment.cmid, studentId: student.id });
    const comparison = compareStoredGrade(state, expectedGrade);

    await attachJson(this, 'Moodle backend grade state after grading (CLI)', state);
    await attachComparison(this, 'Comparison: grade stored by Moodle', comparison);
    expectGradebookReadable(state);
    assertComparison(comparison);
  }
);
