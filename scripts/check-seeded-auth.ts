import { loadEnv } from '../src/support/env';
import { runMoodleCliScript } from '../src/support/moodle-cli';
import { logger } from '../src/utils/logger';

interface AuthCheckOutput {
  ok?: boolean;
  label?: string;
  id?: number;
  username?: string;
  auth?: string;
}

const authScriptPath = '/qa-seed/check-seeded-auth.php';

function parseAuthOutput(stdout: string): AuthCheckOutput {
  try {
    return JSON.parse(stdout) as AuthCheckOutput;
  } catch (error) {
    throw new Error(
      [
        'Seeded Moodle auth check did not return valid JSON.',
        `Parse error: ${(error as Error).message}`,
        stdout.trim() ? `Raw stdout: ${stdout.trim()}` : 'Raw stdout was empty.'
      ].join('\n')
    );
  }
}

function checkUser(label: 'teacher' | 'student', username: string, password: string): void {
  if (!username) {
    throw new Error(`MOODLE_${label.toUpperCase()}_USERNAME is required for seeded auth check.`);
  }

  if (!password) {
    throw new Error(`MOODLE_${label.toUpperCase()}_PASSWORD is required for seeded auth check.`);
  }

  const result = runMoodleCliScript(authScriptPath, {
    env: {
      MOODLE_AUTH_USERNAME: username,
      MOODLE_AUTH_PASSWORD: password,
      MOODLE_AUTH_LABEL: label
    },
    secretEnvNames: ['MOODLE_AUTH_PASSWORD']
  });
  const output = parseAuthOutput(result.stdout);

  if (!output.ok) {
    throw new Error(`Seeded Moodle auth check failed for ${label} user ${username}.`);
  }

  logger.info(`Seeded Moodle auth check passed for ${label} user ${output.username ?? username}.`);
}

function main(): void {
  const env = loadEnv();

  checkUser('teacher', env.teacherUsername, env.teacherPassword);
  checkUser('student', env.studentUsername, env.studentPassword);
}

try {
  main();
} catch (error) {
  logger.error((error as Error).message);
  process.exitCode = 1;
}
