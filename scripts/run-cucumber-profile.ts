import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
  headlessOverride?: boolean;
}

const screencastSlowMoMs = '500';
const screencastStepDelayMs = '2500';

function parseArgs(argv: string[]): ParsedArgs {
  const executionProfile = argv.shift();

  if (executionProfile !== 'demo' && executionProfile !== 'fast') {
    throw new Error(
      'Usage: ts-node scripts/run-cucumber-profile.ts <demo|fast> [--screencast] [--headed|--headless] [--guard-label name] [cucumber args...]'
    );
  }

  const cucumberArgs: string[] = [];
  let guardLabel: string | undefined;
  let screencast = false;
  let headlessOverride: boolean | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--screencast') {
      screencast = true;
      continue;
    }

    if (arg === '--headed') {
      headlessOverride = false;
      continue;
    }

    if (arg === '--headless') {
      headlessOverride = true;
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

  return { executionProfile, cucumberArgs, guardLabel, screencast, headlessOverride };
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

function clean(value: string | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function isCiEnvironment(env: NodeJS.ProcessEnv): boolean {
  return env.CI === 'true' || env.GITHUB_ACTIONS === 'true';
}

function readBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  const cleaned = clean(value)?.toLowerCase();

  if (!cleaned) {
    return fallback;
  }

  return !['0', 'false', 'no', 'off'].includes(cleaned);
}

function readModeEnv(value: string | undefined, fallback: string): string {
  return clean(value) ?? fallback;
}

function readNumberEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(clean(value) ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function buildEnv(profile: 'demo' | 'fast', screencast: boolean, headlessOverride?: boolean): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    MOODLE_EXECUTION_PROFILE: profile
  };

  if (headlessOverride !== undefined) {
    const ciHeadlessOverride = isCiEnvironment(env) ? clean(env.MOODLE_HEADLESS) : undefined;
    env.MOODLE_HEADLESS = ciHeadlessOverride ?? String(headlessOverride);
  } else {
    env.MOODLE_HEADLESS = env.MOODLE_HEADLESS ?? (profile === 'fast' ? 'true' : 'false');
  }

  env.MOODLE_TERMINAL_STEPS = env.MOODLE_TERMINAL_STEPS ?? (profile === 'demo' ? 'true' : 'false');

  if (screencast) {
    env.MOODLE_SCREENCAST = 'true';
    env.MOODLE_VIDEO_MODE = 'on';
    env.MOODLE_TRACE_MODE = 'on';
    env.MOODLE_TERMINAL_STEPS = 'true';
    env.MOODLE_SLOW_MO_MS = env.MOODLE_SLOW_MO_MS ?? screencastSlowMoMs;
    env.MOODLE_STEP_DELAY_MS = env.MOODLE_STEP_DELAY_MS ?? screencastStepDelayMs;
  }

  return env;
}

function writeRuntimeProfileSnapshot(env: NodeJS.ProcessEnv): void {
  const resultsDir = path.resolve('reports', 'allure-results');
  const profileName = clean(env.MOODLE_EXECUTION_PROFILE) ?? 'fast';
  const screencastEnabled = readBooleanEnv(env.MOODLE_SCREENCAST, false);
  const payload = {
    name: profileName,
    headless: readBooleanEnv(env.MOODLE_HEADLESS, profileName === 'fast'),
    screencastEnabled,
    slowMoMs: readNumberEnv(env.MOODLE_SLOW_MO_MS, profileName === 'demo' ? 200 : 0),
    stepDelayMs: readNumberEnv(env.MOODLE_STEP_DELAY_MS, profileName === 'demo' ? 350 : 0),
    traceMode: screencastEnabled ? 'on' : readModeEnv(env.MOODLE_TRACE_MODE, 'retain-on-failure'),
    videoMode: screencastEnabled ? 'on' : readModeEnv(env.MOODLE_VIDEO_MODE, 'off'),
    terminalStepsEnabled: readBooleanEnv(env.MOODLE_TERMINAL_STEPS, profileName === 'demo'),
    generatedAt: new Date().toISOString()
  };

  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(path.join(resultsDir, 'runtime-profile.json'), JSON.stringify(payload, null, 2));
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

  const runEnv = buildEnv(parsed.executionProfile, parsed.screencast, parsed.headlessOverride);
  writeRuntimeProfileSnapshot(runEnv);

  logger.info(
    `Running Cucumber in ${parsed.executionProfile}${parsed.screencast ? ' screencast' : ''} mode: ${cucumberArgs.join(' ')}`
  );
  logger.info(
    `Runtime profile resolved for this run: headless=${runEnv.MOODLE_HEADLESS}, screencast=${runEnv.MOODLE_SCREENCAST ?? 'false'}, video=${runEnv.MOODLE_VIDEO_MODE ?? '<default>'}, trace=${runEnv.MOODLE_TRACE_MODE ?? '<default>'}, slowMoMs=${runEnv.MOODLE_SLOW_MO_MS ?? '<default>'}, stepDelayMs=${runEnv.MOODLE_STEP_DELAY_MS ?? '<default>'}`
  );

  const result = spawnSync(process.execPath, [cucumberBin, ...cucumberArgs], {
    env: runEnv,
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
