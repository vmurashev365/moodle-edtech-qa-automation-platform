import type { GradebookState } from '../domain/grade-comparison';
import { runMoodleCliScript } from './moodle-cli';

export type { GradebookState } from '../domain/grade-comparison';

// One student's grade in one assignment. assignmentCmid is the course module id.
export interface GradeTarget {
  assignmentCmid: number | string;
  studentId: number | string;
}

export interface GradeStateResult {
  ok: boolean;
  cmid: number;
  assignmentInstanceId: number;
  studentId: number;
  assignGrade: number | null;
  gradebookState: GradebookState;
  gradebookGrade: number | null;
  regradeErrors: string[];
}

const readScriptPath = '/qa-seed/read-grade-state.php';
// Below Cucumber's 30 s step timeout, which cannot fire while the synchronous docker call blocks.
const readTimeoutMs = 20_000;
const gradebookStates: GradebookState[] = ['ungraded', 'graded', 'regrade-error', 'missing'];

// Backend check through the Moodle CLI inside the container, not Moodle Web Services.
export function readGradeStateFor(target: GradeTarget): GradeStateResult {
  let stdout: string;

  try {
    stdout = runMoodleCliScript(readScriptPath, {
      env: {
        MOODLE_ASSIGNMENT_ID: String(target.assignmentCmid),
        MOODLE_STUDENT_ID: String(target.studentId)
      },
      timeoutMs: readTimeoutMs
    }).stdout;
  } catch (error) {
    throw new Error(
      [
        `Could not read the grade of Moodle user ${target.studentId} for assignment cmid ${target.assignmentCmid} inside the Moodle container.`,
        'Docker must be running and the controlled stack started (npm run moodle:start && npm run moodle:wait).',
        (error as Error).message
      ].join('\n')
    );
  }

  let result: GradeStateResult;

  try {
    result = JSON.parse(stdout) as GradeStateResult;
  } catch {
    throw new Error(`Grade state read did not return JSON. Raw stdout: ${stdout.trim() || '<empty>'}`);
  }

  if (
    result.ok !== true ||
    !Number.isInteger(result.assignmentInstanceId) ||
    result.assignmentInstanceId <= 0 ||
    !isNumberOrNull(result.assignGrade) ||
    !isNumberOrNull(result.gradebookGrade) ||
    !gradebookStates.includes(result.gradebookState) ||
    !Array.isArray(result.regradeErrors)
  ) {
    throw new Error(`Grade state read returned an unexpected payload: ${JSON.stringify(result)}`);
  }

  return result;
}

// A failed regrade and a missing grade item get their own messages; a plain comparison would only say
// that the grade differs.
export function expectGradebookReadable(state: GradeStateResult): void {
  const student = `Moodle user ${state.studentId}`;

  if (state.gradebookState === 'regrade-error') {
    const details = state.regradeErrors.length ? state.regradeErrors.join('; ') : 'Moodle reported no details';
    throw new Error(
      `The Moodle gradebook regrade failed, so the gradebook grade for ${student} could not be read: ${details}`
    );
  }

  if (state.gradebookState === 'missing') {
    throw new Error(
      `No gradebook grade item exists for assignment cmid ${state.cmid}, so the gradebook holds no grade for ${student}. ` +
        'Run npm run moodle:seed:ready.'
    );
  }
}

function isNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}
