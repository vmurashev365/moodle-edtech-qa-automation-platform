import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { logger } from '../src/utils/logger';

interface CucumberJsonElement {
  type?: string;
  keyword?: string;
}

interface CucumberJsonFeature {
  elements?: CucumberJsonElement[];
}

interface ParsedArgs {
  executionProfile: 'demo' | 'fast';
  cucumberArgs: string[];
  guardLabel?: string;
  screencast: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const executionProfile = argv.shift();

  if (executionProfile !== 'demo' && executionProfile !== 'fast') {
    throw new Error(
      'Usage: ts-node scripts/run-cucumber-profile.ts <demo|fast> [--screencast] [--guard-label name] [cucumber args...]'
    );
  }

  const cucumberArgs: string[] = [];
  let guardLabel: string | undefined;
  let screencast = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--screencast') {
      screencast = true;
      continue;
    }

    if (arg === '--guard-label') {
      guardLabel = argv[index + 1];
      index += 1;
      continue;
    }

    cucumberArgs.push(arg);
  }

  if (!hasCucumberProfile(cucumberArgs)) {
    cucumberArgs.unshift('--profile', screencast && executionProfile === 'demo' ? 'screencast' : executionProfile);
  }

  return { executionProfile, cucumberArgs, guardLabel, screencast };
}

function hasCucumberProfile(args: string[]): boolean {
  return args.includes('--profile') || args.some((arg) => arg.startsWith('--profile='));
}

function safeFileName(name: string): string {
  return (
    name
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'cucumber-selection'
  );
}

function countSelectedScenarios(reportPath: string): number {
  if (!existsSync(reportPath)) {
    return 0;
  }

  const payload = JSON.parse(readFileSync(reportPath, 'utf8')) as CucumberJsonFeature[];

  if (!Array.isArray(payload)) {
    return 0;
  }

  return payload.reduce((count, feature) => {
    const elements = Array.isArray(feature.elements) ? feature.elements : [];
    return count + elements.filter((element) => element.type === 'scenario' || element.keyword === 'Scenario').length;
  }, 0);
}

function buildEnv(profile: 'demo' | 'fast', screencast: boolean): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    MOODLE_EXECUTION_PROFILE: profile
  };

  env.MOODLE_HEADLESS = env.MOODLE_HEADLESS ?? (profile === 'fast' ? 'true' : 'false');
  env.MOODLE_TERMINAL_STEPS = env.MOODLE_TERMINAL_STEPS ?? (profile === 'demo' ? 'true' : 'false');

  if (screencast) {
    env.MOODLE_SCREENCAST = 'true';
    env.MOODLE_VIDEO_MODE = 'on';
    env.MOODLE_TRACE_MODE = 'on';
    env.MOODLE_TERMINAL_STEPS = 'true';
  }

  return env;
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  const cucumberBin = path.resolve('node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber-js');
  const reportDirectory = path.resolve('reports', 'cucumber');
  const cucumberArgs = [...parsed.cucumberArgs];

  mkdirSync(reportDirectory, { recursive: true });

  let guardReportPath: string | undefined;

  if (parsed.guardLabel) {
    const guardReportRelativePath = path.posix.join(
      'reports',
      'cucumber',
      `${safeFileName(parsed.guardLabel)}-guard-report.json`
    );
    guardReportPath = path.resolve(guardReportRelativePath);
    cucumberArgs.push('--format', `json:${guardReportRelativePath}`);
  }

  logger.info(
    `Running Cucumber in ${parsed.executionProfile}${parsed.screencast ? ' screencast' : ''} mode: ${cucumberArgs.join(' ')}`
  );

  const result = spawnSync(process.execPath, [cucumberBin, ...cucumberArgs], {
    env: buildEnv(parsed.executionProfile, parsed.screencast),
    stdio: 'inherit',
    windowsHide: true
  });

  if (result.error) {
    throw result.error;
  }

  if (guardReportPath) {
    const selectedScenarioCount = countSelectedScenarios(guardReportPath);

    if (selectedScenarioCount === 0 && result.status === 0) {
      logger.error(
        `${parsed.guardLabel} selected 0 executable Cucumber scenarios. Failing intentionally to prevent a false-green command.`
      );
      process.exitCode = 1;
      return;
    }

    logger.info(`${parsed.guardLabel} selected ${selectedScenarioCount} executable Cucumber scenario(s).`);
  }

  process.exitCode = result.status ?? 1;
}

try {
  main();
} catch (error) {
  logger.error((error as Error).message);
  process.exitCode = 1;
}
