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

export const moodleServiceName = 'moodle';
// Bitnami Moodle serves PHP as `daemon`. CLI scripts must run as the same user; running them as root
// leaves root-owned moodledata/temp directories that later break web requests with permission errors.
export const moodleCliUser = 'daemon';

export function runCommand(
  command: string,
  args: string[],
  options: { allowFailure?: boolean; secretEnvNames?: string[] } = {}
): CommandResult {
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
    throw new Error(formatCommandFailure(command, args, commandResult, options.secretEnvNames));
  }

  return commandResult;
}

export function formatCommandFailure(
  command: string,
  args: string[],
  result: CommandResult,
  secretEnvNames: string[] = []
): string {
  const redact = (arg: string): string => {
    const name = secretEnvNames.find((secretName) => arg.startsWith(`${secretName}=`));
    return name ? `${name}=<redacted>` : arg;
  };
  const commandLine = [command, ...args].map(redact).join(' ');
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
  const envArgs = Object.entries(options.env ?? {}).flatMap(([name, value]) => ['-e', `${name}=${value}`]);

  return runCommand(
    'docker',
    ['compose', 'exec', '-T', '--user', moodleCliUser, ...envArgs, moodleServiceName, 'php', scriptPath],
    { secretEnvNames: options.secretEnvNames }
  );
}
