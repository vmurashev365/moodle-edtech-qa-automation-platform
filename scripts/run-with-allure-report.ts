import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';

import { readBooleanEnv } from '../src/support/env-values';

const scriptName = process.argv[2];
const forwardedArgs = process.argv.slice(3);
const reportDir = path.resolve('reports', 'allure-report');

if (!scriptName) {
  console.error('Usage: ts-node scripts/run-with-allure-report.ts <npm-script> [-- forwarded args]');
  process.exit(1);
}

function npmCommand(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function runNpm(args: string[]): number {
  const result = spawnSync(npmCommand(), args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env
  });

  if (result.error) {
    console.error(result.error.message);
    return 1;
  }

  return result.status ?? 1;
}

function shouldAutoOpenReport(): boolean {
  const localDefault = process.env.CI !== 'true' && process.env.GITHUB_ACTIONS !== 'true';

  return readBooleanEnv(process.env, 'ALLURE_AUTO_OPEN') ?? localDefault;
}

function openAllureReport(): void {
  if (!shouldAutoOpenReport()) {
    console.log('[test-report] Allure auto-open disabled by ALLURE_AUTO_OPEN or CI environment.');
    return;
  }

  const allureBin = path.resolve('node_modules', 'allure-commandline', 'bin', 'allure');
  const opener = spawn(process.execPath, [allureBin, 'open', reportDir], {
    detached: true,
    env: { ...process.env, DEBUG: '' },
    stdio: 'ignore',
    windowsHide: true
  });

  opener.unref();
  console.log(`[test-report] Allure viewer opening in the background: ${reportDir}`);
}

const cleanStatus = runNpm(['run', 'clean:allure']);

if (cleanStatus !== 0) {
  process.exit(cleanStatus);
}

const testStatus = runNpm(['run', scriptName, ...(forwardedArgs.length > 0 ? ['--', ...forwardedArgs] : [])]);

if (testStatus !== 0) {
  console.error(`[test-report] ${scriptName} failed with exit code ${testStatus}; generating Allure report anyway.`);
}

const reportStatus = runNpm(['run', 'report:allure']);

if (reportStatus !== 0 && testStatus === 0) {
  process.exit(reportStatus);
}

if (reportStatus === 0) {
  openAllureReport();
}

process.exit(testStatus);
