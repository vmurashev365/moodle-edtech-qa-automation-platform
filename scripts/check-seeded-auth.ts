import { spawnSync } from 'node:child_process';

import { loadEnv } from '../src/support/env';
import { logger } from '../src/utils/logger';

interface CommandResult {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}

interface AuthCheckOutput {
  ok?: boolean;
  label?: string;
  id?: number;
  username?: string;
  auth?: string;
}

const moodleServiceName = 'moodle';
const authScriptPath = '/qa-seed/check-seeded-auth.php';

function runCommand(command: string, args: string[], options: { allowFailure?: boolean } = {}): CommandResult {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    windowsHide: true
  });

  const commandResult: CommandResult = {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error
  };

  if (!options.allowFailure && (result.error || result.status !== 0)) {
    throw new Error(formatCommandFailure(command, args, commandResult));
  }

  return commandResult;
}

function formatCommandFailure(command: string, args: string[], result: CommandResult): string {
  const commandLine = [command, ...args].map(redactCommandArg).join(' ');
  const details = [
    `Command failed: ${commandLine}`,
    result.status === null ? undefined : `Exit code: ${result.status}`,
    result.error ? `Error: ${result.error.message}` : undefined,
    result.stderr.trim() ? `stderr: ${result.stderr.trim()}` : undefined,
    result.stdout.trim() ? `stdout: ${result.stdout.trim()}` : undefined
  ].filter(Boolean);

  return details.join('\n');
}

function redactCommandArg(value: string): string {
  return value.startsWith('MOODLE_AUTH_PASSWORD=') ? 'MOODLE_AUTH_PASSWORD=<redacted>' : value;
}

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

  const args = [
    'compose',
    'exec',
    '-T',
    '-e',
    `MOODLE_AUTH_USERNAME=${username}`,
    '-e',
    `MOODLE_AUTH_PASSWORD=${password}`,
    '-e',
    `MOODLE_AUTH_LABEL=${label}`,
    moodleServiceName,
    'php',
    authScriptPath
  ];

  const result = runCommand('docker', args);
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
