import type { GradebookState, GradeTarget } from './grade-state';
import { runMoodleCliScript } from './moodle-cli';

export interface UngradedBaselineResult {
  ok: boolean;
  cmid: number;
  studentId: number;
  assignGrade: number | null;
  gradebookState: GradebookState;
  gradebookGrade: number | null;
  status: string;
}

const resetScriptPath = '/qa-seed/reset-ungraded-baseline.php';
// Below Cucumber's 30 s step timeout, which cannot fire while the synchronous docker call blocks.
const resetTimeoutMs = 20_000;

// Resets one student's grade in one assignment to "not graded" through Moodle's own grading API, inside the
// Moodle container. Called by the Given step that establishes an ungraded submission, so a scenario owns its
// starting state and passes in any order and on repeated runs.
export function resetUngradedBaseline(target: GradeTarget): UngradedBaselineResult {
  let stdout: string;

  try {
    stdout = runMoodleCliScript(resetScriptPath, {
      env: {
        MOODLE_ASSIGNMENT_ID: String(target.assignmentCmid),
        MOODLE_STUDENT_ID: String(target.studentId)
      },
      timeoutMs: resetTimeoutMs
    }).stdout;
  } catch (error) {
    throw new Error(
      [
        `Could not reset the grade of Moodle user ${target.studentId} for assignment cmid ${target.assignmentCmid} to "not graded" inside the Moodle container.`,
        'Docker must be running and the controlled stack started (npm run moodle:start && npm run moodle:wait).',
        (error as Error).message
      ].join('\n')
    );
  }

  let result: UngradedBaselineResult;

  try {
    result = JSON.parse(stdout) as UngradedBaselineResult;
  } catch {
    throw new Error(`Ungraded baseline reset did not return JSON. Raw stdout: ${stdout.trim() || '<empty>'}`);
  }

  if (
    !result.ok ||
    result.status !== 'notgraded' ||
    result.gradebookState !== 'ungraded' ||
    result.gradebookGrade !== null
  ) {
    throw new Error(`Ungraded baseline reset did not leave the student ungraded: ${JSON.stringify(result)}`);
  }

  return result;
}
