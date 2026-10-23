import type { TestEnv } from './env';
import { runMoodleCliScript } from './moodle-cli';

export type GradebookState = 'ungraded' | 'graded' | 'regrade-error' | 'missing';

export interface GradeStateResult {
  ok: boolean;
  cmid: number;
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
export function readGradeState(env: TestEnv): GradeStateResult {
  if (!env.assignmentId || !env.studentId) {
    throw new Error(
      'MOODLE_ASSIGNMENT_ID and MOODLE_STUDENT_ID are required to read the stored grade. Run npm run moodle:seed:ready.'
    );
  }

  let stdout: string;

  try {
    stdout = runMoodleCliScript(readScriptPath, {
      env: {
        MOODLE_ASSIGNMENT_ID: env.assignmentId,
        MOODLE_STUDENT_ID: env.studentId
      },
      timeoutMs: readTimeoutMs
    }).stdout;
  } catch (error) {
    throw new Error(
      [
        'Could not read the deterministic student grade inside the Moodle container.',
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
    !isNumberOrNull(result.assignGrade) ||
    !isNumberOrNull(result.gradebookGrade) ||
    !gradebookStates.includes(result.gradebookState) ||
    !Array.isArray(result.regradeErrors)
  ) {
    throw new Error(`Grade state read returned an unexpected payload: ${JSON.stringify(result)}`);
  }

  return result;
}

export function expectStoredGrade(state: GradeStateResult, expectedGrade: number): void {
  const student = `Moodle user ${state.studentId}`;

  if (state.assignGrade !== expectedGrade) {
    throw new Error(
      `Expected the assignment grade stored for ${student} (assignment cmid ${state.cmid}) to be ${expectedGrade}, ` +
        `but Moodle stores ${formatGrade(state.assignGrade)}.`
    );
  }

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

  if (state.gradebookState !== 'graded') {
    throw new Error(
      `Expected the gradebook to hold a grade for ${student}, but its state is "${state.gradebookState}".`
    );
  }

  if (state.gradebookGrade !== expectedGrade) {
    throw new Error(
      `Expected the gradebook grade stored for ${student} to be ${expectedGrade}, ` +
        `but Moodle stores ${formatGrade(state.gradebookGrade)}.`
    );
  }
}

function isNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function formatGrade(grade: number | null): string {
  if (grade === null) {
    return 'no grade';
  }

  // Moodle's assign API stores -1 for "not graded".
  return grade < 0 ? `${grade} (not graded)` : String(grade);
}
