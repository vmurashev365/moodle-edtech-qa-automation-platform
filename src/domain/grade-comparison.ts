import { buildComparison, type ComparisonRecord } from './comparison';

export type GradebookState = 'ungraded' | 'graded' | 'regrade-error' | 'missing';

// What Moodle stores for one student in one assignment, as read by scripts/moodle/read-grade-state.php.
export interface StoredGradeState {
  assignGrade: number | null;
  gradebookState: GradebookState;
  gradebookGrade: number | null;
}

// What the gradebook grader report shows for one student and one grade item. null: not found on the page.
export interface GradebookCellObservation {
  studentName: string | null;
  studentEmail: string | null;
  columnAssignmentName: string | null;
  cellText: string | null;
}

export interface GradebookCellExpectation {
  studentDisplayName: string;
  studentEmail: string;
  assignmentName: string;
  // The exact text of the grade cell, for example "82.00".
  grade: string;
}

// What Moodle's single-user grading interface shows about the submission. null: not found on the page.
export interface SubmissionObservation {
  studentName: string | null;
  studentEmail: string | null;
  submissionStatus: string | null;
  gradingStatus: string | null;
  submissionText: string | null;
}

export interface SubmissionExpectation {
  studentDisplayName: string;
  studentEmail: string;
  submissionText: string;
}

const notGraded = 'not graded';
const assignmentRecordSource = 'Moodle assignment grade record (CLI read)';
const gradebookRecordSource = 'Moodle gradebook record (CLI read)';
const gradebookPageSource = 'Gradebook grader report (browser)';
const gradingPageSource = 'Single-user grading page (browser)';

// Moodle's assign API stores -1, or no grade row at all, for "not graded".
export function describeAssignGrade(grade: number | null): string {
  return grade === null || grade < 0 ? notGraded : String(grade);
}

function describeGradebookGrade(grade: number | null): string {
  return grade === null ? 'no grade' : String(grade);
}

function describeRawGrade(grade: number | null): string {
  return grade === null ? 'no grade row' : String(grade);
}

// The seed creates assignments with whole-number grades from 0 to the assignment's maximum grade.
export function parseGradeEntry(text: string, maxGrade: number): number {
  const trimmed = text.trim();
  const grade = /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN;

  if (!Number.isSafeInteger(grade) || grade > maxGrade) {
    throw new Error(`A grade must be a whole number from 0 to ${maxGrade}; the scenario says "${text}".`);
  }

  return grade;
}

function ungradedChecks(state: StoredGradeState) {
  return [
    {
      field: 'assignment grade',
      source: assignmentRecordSource,
      expected: notGraded,
      actual: describeAssignGrade(state.assignGrade)
    },
    {
      field: 'gradebook state',
      source: gradebookRecordSource,
      expected: 'ungraded',
      actual: state.gradebookState
    },
    {
      field: 'gradebook grade',
      source: gradebookRecordSource,
      expected: 'no grade',
      actual: describeGradebookGrade(state.gradebookGrade)
    }
  ];
}

export function compareUngradedBaseline(state: StoredGradeState, comparedAt?: Date): ComparisonRecord {
  return buildComparison({
    evidenceType: 'ungraded-baseline',
    rule: 'Before anyone grades it, the submission has no grade in the assignment or in the gradebook.',
    comparedAt,
    checks: ungradedChecks(state)
  });
}

// After an attempt that must not grade: still no grade, and the stored assignment grade value is the very
// value from before the attempt (Moodle's -1 and "no grade row" both read as "not graded", so they are
// compared separately).
export function compareStillNotGraded(
  before: StoredGradeState,
  after: StoredGradeState,
  comparedAt?: Date
): ComparisonRecord {
  return buildComparison({
    evidenceType: 'still-not-graded',
    rule: 'An attempt to grade without permission leaves the submission without a grade.',
    comparedAt,
    checks: [
      ...ungradedChecks(after),
      {
        field: 'stored assignment grade value, unchanged since before the attempt',
        source: assignmentRecordSource,
        expected: describeRawGrade(before.assignGrade),
        actual: describeRawGrade(after.assignGrade)
      }
    ]
  });
}

export function compareStoredGrade(
  state: StoredGradeState,
  expectedGrade: number,
  comparedAt?: Date
): ComparisonRecord {
  return buildComparison({
    evidenceType: 'stored-grade-reconciliation',
    rule: 'The grade the teacher saved is the grade Moodle stores for the assignment and in the gradebook.',
    comparedAt,
    checks: [
      {
        field: 'assignment grade',
        source: assignmentRecordSource,
        expected: String(expectedGrade),
        actual: describeAssignGrade(state.assignGrade)
      },
      {
        field: 'gradebook state',
        source: gradebookRecordSource,
        expected: 'graded',
        actual: state.gradebookState
      },
      {
        field: 'gradebook grade',
        source: gradebookRecordSource,
        expected: String(expectedGrade),
        actual: describeGradebookGrade(state.gradebookGrade)
      }
    ]
  });
}

export function compareGradebookCell(
  observation: GradebookCellObservation,
  expectation: GradebookCellExpectation,
  comparedAt?: Date
): ComparisonRecord {
  return buildComparison({
    evidenceType: 'gradebook-cell',
    rule: "The gradebook shows the grade in the student's row and the assignment's column.",
    comparedAt,
    checks: [
      {
        field: 'student in the row',
        source: gradebookPageSource,
        expected: expectation.studentDisplayName,
        actual: observation.studentName
      },
      {
        field: 'student email in the row',
        source: gradebookPageSource,
        expected: expectation.studentEmail,
        actual: observation.studentEmail
      },
      {
        field: 'assignment of the column',
        source: gradebookPageSource,
        expected: expectation.assignmentName,
        actual: observation.columnAssignmentName
      },
      {
        // Exact, so 182.00 or a matching Course total cannot satisfy it.
        field: 'grade cell',
        source: gradebookPageSource,
        expected: expectation.grade,
        actual: observation.cellText
      }
    ]
  });
}

export function compareSubmissionReadyForGrading(
  observation: SubmissionObservation,
  expectation: SubmissionExpectation,
  comparedAt?: Date
): ComparisonRecord {
  return buildComparison({
    evidenceType: 'submission-ready-for-grading',
    rule: "The grading page shows this student's submitted work, and it has no grade yet.",
    comparedAt,
    checks: [
      {
        field: 'student',
        source: gradingPageSource,
        expected: expectation.studentDisplayName,
        actual: observation.studentName
      },
      {
        field: 'student email',
        source: gradingPageSource,
        expected: expectation.studentEmail,
        actual: observation.studentEmail
      },
      {
        field: 'submission status',
        source: gradingPageSource,
        expected: 'Submitted for grading',
        actual: observation.submissionStatus
      },
      {
        field: 'grading status',
        source: gradingPageSource,
        expected: 'Not graded',
        actual: observation.gradingStatus
      },
      {
        field: 'submitted text',
        source: gradingPageSource,
        expected: expectation.submissionText,
        actual: observation.submissionText
      }
    ]
  });
}
