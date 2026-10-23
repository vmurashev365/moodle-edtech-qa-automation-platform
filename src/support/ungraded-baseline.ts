import { Before } from '@cucumber/cucumber';
import { attachJson } from '../utils/evidence';
import type { MoodleWorld } from './custom-world';
import type { TestEnv } from './env';
import type { GradebookState } from './grade-state';
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
// Below Cucumber's 30 s hook timeout, which cannot fire while the synchronous docker call blocks.
const resetTimeoutMs = 20_000;

export function resetUngradedBaseline(env: TestEnv): UngradedBaselineResult {
  if (!env.assignmentId || !env.studentId) {
    throw new Error(
      'MOODLE_ASSIGNMENT_ID and MOODLE_STUDENT_ID are required to reset the ungraded baseline. Run npm run moodle:seed:ready.'
    );
  }

  let stdout: string;

  try {
    stdout = runMoodleCliScript(resetScriptPath, {
      env: {
        MOODLE_ASSIGNMENT_ID: env.assignmentId,
        MOODLE_STUDENT_ID: env.studentId
      },
      timeoutMs: resetTimeoutMs
    }).stdout;
  } catch (error) {
    throw new Error(
      [
        'Could not reset the deterministic student grade to "not graded" inside the Moodle container.',
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

// Grade-dependent scenarios own their starting state, so they pass in any execution order.
Before(
  { tags: '@ungraded-baseline', name: 'Reset deterministic student grade to not graded' },
  async function (this: MoodleWorld) {
    const result = resetUngradedBaseline(this.env);
    await attachJson(this, 'Ungraded grading baseline', result);
  }
);
