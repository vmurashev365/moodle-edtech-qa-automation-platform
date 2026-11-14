import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ComparisonRecord } from '../../../src/domain/comparison';
import {
  compareGradebookCell,
  compareStillNotGraded,
  compareStoredGrade,
  compareSubmissionReadyForGrading,
  compareUngradedBaseline,
  parseGradeEntry,
  type GradebookCellObservation,
  type StoredGradeState,
  type SubmissionObservation
} from '../../../src/domain/grade-comparison';

function failedFields(record: ComparisonRecord): string[] {
  return record.checks.filter((check) => check.status === 'MISMATCH').map((check) => check.field);
}

const ungraded: StoredGradeState = { assignGrade: -1, gradebookState: 'ungraded', gradebookGrade: null };

describe('compareUngradedBaseline', () => {
  it("passes for Moodle's two ways of storing no assignment grade", () => {
    assert.equal(compareUngradedBaseline(ungraded).verdict, 'PASS');
    assert.equal(compareUngradedBaseline({ ...ungraded, assignGrade: null }).verdict, 'PASS');
  });

  it('treats a grade of zero as a grade', () => {
    const record = compareUngradedBaseline({ assignGrade: 0, gradebookState: 'graded', gradebookGrade: 0 });

    assert.equal(record.verdict, 'FAIL');
    assert.deepEqual(failedFields(record), ['assignment grade', 'gradebook state', 'gradebook grade']);
  });

  it('fails when only the gradebook still holds a grade', () => {
    const record = compareUngradedBaseline({ assignGrade: -1, gradebookState: 'graded', gradebookGrade: 82 });

    assert.deepEqual(failedFields(record), ['gradebook state', 'gradebook grade']);
  });
});

describe('compareStillNotGraded', () => {
  const unchangedField = 'stored assignment grade value, unchanged since before the attempt';

  it('passes when nothing is stored after the attempt and the stored value did not change', () => {
    assert.equal(compareStillNotGraded(ungraded, ungraded).verdict, 'PASS');
  });

  it('fails when the attempt stored a grade', () => {
    const graded: StoredGradeState = { assignGrade: 82, gradebookState: 'graded', gradebookGrade: 82 };

    assert.deepEqual(failedFields(compareStillNotGraded(ungraded, graded)), [
      'assignment grade',
      'gradebook state',
      'gradebook grade',
      unchangedField
    ]);
  });

  it('fails when the stored value changed although both values mean "not graded"', () => {
    const record = compareStillNotGraded({ ...ungraded, assignGrade: null }, ungraded);

    assert.deepEqual(failedFields(record), [unchangedField]);
  });

  it('fails when only the gradebook changed', () => {
    const record = compareStillNotGraded(ungraded, { ...ungraded, gradebookState: 'graded', gradebookGrade: 82 });

    assert.deepEqual(failedFields(record), ['gradebook state', 'gradebook grade']);
  });
});

describe('compareStoredGrade', () => {
  const graded: StoredGradeState = { assignGrade: 82, gradebookState: 'graded', gradebookGrade: 82 };

  it('passes when the assignment and the gradebook both store the expected grade', () => {
    const record = compareStoredGrade(graded, 82);

    assert.equal(record.verdict, 'PASS');
    assert.deepEqual(
      record.checks.map((check) => [check.field, check.expected, check.actual]),
      [
        ['assignment grade', '82', '82'],
        ['gradebook state', 'graded', 'graded'],
        ['gradebook grade', '82', '82']
      ]
    );
  });

  it('fails when the gradebook stores a different grade than the assignment', () => {
    assert.deepEqual(failedFields(compareStoredGrade({ ...graded, gradebookGrade: 80 }, 82)), ['gradebook grade']);
  });

  it('fails when the assignment stores a different grade', () => {
    assert.deepEqual(failedFields(compareStoredGrade({ ...graded, assignGrade: 182 }, 82)), ['assignment grade']);
    assert.deepEqual(failedFields(compareStoredGrade({ ...graded, assignGrade: 82.5 }, 82)), ['assignment grade']);
  });

  it('fails when nothing was saved', () => {
    const record = compareStoredGrade(ungraded, 82);

    assert.deepEqual(failedFields(record), ['assignment grade', 'gradebook state', 'gradebook grade']);
    assert.equal(record.checks[0].actual, 'not graded');
  });

  it('fails when the gradebook could not be regraded or has no grade item', () => {
    assert.deepEqual(
      failedFields(compareStoredGrade({ assignGrade: 82, gradebookState: 'regrade-error', gradebookGrade: null }, 82)),
      ['gradebook state', 'gradebook grade']
    );
    assert.deepEqual(
      failedFields(compareStoredGrade({ assignGrade: 82, gradebookState: 'missing', gradebookGrade: null }, 82)),
      ['gradebook state', 'gradebook grade']
    );
  });
});

describe('compareGradebookCell', () => {
  const expectation = {
    studentDisplayName: 'Student QA',
    studentEmail: 'student.qa@example.test',
    assignmentName: 'Essay: Test Automation Strategy',
    grade: '82.00'
  };
  const observation: GradebookCellObservation = {
    studentName: ' Student QA ',
    studentEmail: 'student.qa@example.test',
    columnAssignmentName: 'Essay: Test Automation Strategy',
    cellText: ' 82.00 '
  };

  it('passes when the row, the column and the cell agree with the expectation', () => {
    const record = compareGradebookCell(observation, expectation);

    assert.equal(record.verdict, 'PASS');
    assert.ok(record.checks.every((check) => check.match === 'equals'));
  });

  it('requires the cell to equal the grade exactly', () => {
    assert.deepEqual(failedFields(compareGradebookCell({ ...observation, cellText: '182.00' }, expectation)), [
      'grade cell'
    ]);
    assert.deepEqual(failedFields(compareGradebookCell({ ...observation, cellText: '-' }, expectation)), [
      'grade cell'
    ]);
  });

  it('fails when the row belongs to another student, even one whose name contains the expected name', () => {
    const record = compareGradebookCell(
      { ...observation, studentName: 'Student QA Junior', studentEmail: 'junior@example.test' },
      expectation
    );

    assert.deepEqual(failedFields(record), ['student in the row', 'student email in the row']);
  });

  it('fails when the column belongs to another assignment', () => {
    const record = compareGradebookCell({ ...observation, columnAssignmentName: 'Quiz 1' }, expectation);

    assert.deepEqual(failedFields(record), ['assignment of the column']);
  });

  it('fails every check when nothing could be read from the page', () => {
    const record = compareGradebookCell(
      { studentName: null, studentEmail: null, columnAssignmentName: null, cellText: null },
      expectation
    );

    assert.equal(record.verdict, 'FAIL');
    assert.equal(failedFields(record).length, 4);
  });
});

describe('compareSubmissionReadyForGrading', () => {
  const expectation = {
    studentDisplayName: 'Student QA',
    studentEmail: 'student.qa@example.test',
    submissionText: 'The submitted essay text.'
  };
  const observation: SubmissionObservation = {
    studentName: '  Student QA  ',
    studentEmail: 'student.qa@example.test',
    submissionStatus: 'Submitted for grading',
    gradingStatus: 'Not graded',
    submissionText: 'The submitted essay text.'
  };

  it("passes for the student's submitted, ungraded work", () => {
    assert.equal(compareSubmissionReadyForGrading(observation, expectation).verdict, 'PASS');
  });

  it('fails for a draft, for graded work and for another text', () => {
    assert.deepEqual(
      failedFields(
        compareSubmissionReadyForGrading({ ...observation, submissionStatus: 'Draft (not submitted)' }, expectation)
      ),
      ['submission status']
    );
    assert.deepEqual(
      failedFields(compareSubmissionReadyForGrading({ ...observation, gradingStatus: 'Graded' }, expectation)),
      ['grading status']
    );
    assert.deepEqual(
      failedFields(compareSubmissionReadyForGrading({ ...observation, submissionText: 'Another text.' }, expectation)),
      ['submitted text']
    );
  });

  it('fails when the page shows another student', () => {
    const record = compareSubmissionReadyForGrading(
      { ...observation, studentName: 'Other Student', studentEmail: 'other@example.test' },
      expectation
    );

    assert.deepEqual(failedFields(record), ['student', 'student email']);
  });
});

describe('parseGradeEntry', () => {
  it('accepts whole numbers from zero to the maximum grade', () => {
    assert.equal(parseGradeEntry('82', 100), 82);
    assert.equal(parseGradeEntry('0', 100), 0);
    assert.equal(parseGradeEntry(' 100 ', 100), 100);
  });

  it('rejects anything else by naming what the scenario said', () => {
    for (const text of ['101', '-1', '82.5', '82 / 100', 'A', '']) {
      assert.throws(() => parseGradeEntry(text, 100), /whole number from 0 to 100/, `accepted "${text}"`);
    }
  });
});
