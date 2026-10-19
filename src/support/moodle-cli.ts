import { spawnSync } from 'node:child_process';

export interface CommandResult {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}

export interface MoodleCliScriptOptions {
  env?: Record<string, string>;
  secretEnvNames?: string[];
}

interface RunCommandOptions {
  allowFailure?: boolean;
  env?: Record<string, string>;
  secrets?: string[];
}

export const moodleServiceName = 'moodle';
// Bitnami Moodle serves PHP as `daemon`. CLI scripts must run as the same user; running them as root
// leaves root-owned moodledata/temp directories that later break web requests with permission errors.
export const moodleCliUser = 'daemon';

export function runCommand(command: string, args: string[], options: RunCommandOptions = {}): CommandResult {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: options.env ? { ...process.env, ...options.env } : process.env,
    windowsHide: true
  });

  const commandResult: CommandResult = {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error
  };

  if (!options.allowFailure && (result.error || result.status !== 0)) {
    throw new Error(redactSecrets(formatCommandFailure(command, args, commandResult), options.secrets ?? []));
  }

  return commandResult;
}

export function redactSecrets(text: string, secrets: string[]): string {
  return secrets.filter(Boolean).reduce((redacted, secret) => redacted.split(secret).join('<redacted>'), text);
}

export function formatCommandFailure(command: string, args: string[], result: CommandResult): string {
  const commandLine = [command, ...args].join(' ');
  const details = [
    `Command failed: ${commandLine}`,
    result.status === null ? undefined : `Exit code: ${result.status}`,
    result.error ? `Error: ${result.error.message}` : undefined,
    result.stderr.trim() ? `stderr: ${result.stderr.trim()}` : undefined,
    result.stdout.trim() ? `stdout: ${result.stdout.trim()}` : undefined
  ].filter(Boolean);

  return details.join('\n');
}

export function requireDocker(): void {
  runCommand('docker', ['--version']);
  runCommand('docker', ['compose', 'version']);
}

export function requireRunningMoodleService(): void {
  const result = runCommand('docker', ['compose', 'ps', '--status', 'running', '--services']);
  const services = result.stdout
    .split(/\r?\n/)
    .map((service) => service.trim())
    .filter(Boolean);

  if (!services.includes(moodleServiceName)) {
    throw new Error(
      [
        `Docker Compose service "${moodleServiceName}" is not running.`,
        'Start the local controlled Moodle stack first:',
        '  npm run moodle:start',
        '  npm run moodle:wait'
      ].join('\n')
    );
  }
}

export function runMoodleCliScript(scriptPath: string, options: MoodleCliScriptOptions = {}): CommandResult {
  const env = options.env ?? {};
  // `-e NAME` without a value makes docker compose exec copy NAME from its own environment, so values
  // (passwords included) stay out of argv, process listings and the failure message.
  const envArgs = Object.keys(env).flatMap((name) => ['-e', name]);
  const secrets = (options.secretEnvNames ?? []).map((name) => env[name]);

  return runCommand(
    'docker',
    ['compose', 'exec', '-T', '--user', moodleCliUser, ...envArgs, moodleServiceName, 'php', scriptPath],
    { env, secrets }
  );
}
