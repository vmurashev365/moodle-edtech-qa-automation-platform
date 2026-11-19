import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import * as dotenv from 'dotenv';

import { resolveRuntimeProfile, type RuntimeProfile } from '../src/support/runtime-profile';
import { logger } from '../src/utils/logger';
import { emptySelectionMessage, inspectScenarioSelection } from './lib/scenario-guard';

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

function clean(value: string | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function isCiEnvironment(env: NodeJS.ProcessEnv): boolean {
  return env.CI === 'true' || env.GITHUB_ACTIONS === 'true';
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

function writeRuntimeProfileSnapshot(profile: RuntimeProfile): void {
  const resultsDir = path.resolve('reports', 'allure-results');
  const payload = {
    name: profile.name,
    headless: profile.headless,
    screencastEnabled: profile.screencastEnabled,
    slowMoMs: profile.slowMoMs,
    stepDelayMs: profile.stepDelayMs,
    traceMode: profile.traceMode,
    videoMode: profile.videoMode,
    terminalStepsEnabled: profile.terminalStepsEnabled,
    generatedAt: new Date().toISOString()
  };

  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(path.join(resultsDir, 'runtime-profile.json'), JSON.stringify(payload, null, 2));
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  const cucumberBin = path.resolve('node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber-js');
  const cucumberArgs = [...parsed.cucumberArgs];
  const guardLabel = parsed.guardLabel ?? `${parsed.executionProfile} run`;
  const selection = await inspectScenarioSelection(cucumberArgs);

  if (selection.selected === 0) {
    logger.error(emptySelectionMessage(guardLabel, selection));
    process.exitCode = 1;
    return;
  }

  logger.info(`${guardLabel} selected ${selection.selected} executable Cucumber scenario(s).`);

  // Load .env without overriding the outer environment, exactly as the Cucumber child process will,
  // so the snapshot describes the profile the browser actually runs with.
  dotenv.config({ quiet: true });
  const runEnv = buildEnv(parsed.executionProfile, parsed.screencast, parsed.headlessOverride);
  const runtimeProfile = resolveRuntimeProfile(runEnv);
  writeRuntimeProfileSnapshot(runtimeProfile);

  logger.info(
    `Running Cucumber in ${parsed.executionProfile}${parsed.screencast ? ' screencast' : ''} mode: ${cucumberArgs.join(' ')}`
  );
  logger.info(
    `Runtime profile resolved for this run: headless=${runtimeProfile.headless}, screencast=${runtimeProfile.screencastEnabled}, video=${runtimeProfile.videoMode}, trace=${runtimeProfile.traceMode}, slowMoMs=${runtimeProfile.slowMoMs}, stepDelayMs=${runtimeProfile.stepDelayMs}`
  );

  const result = spawnSync(process.execPath, [cucumberBin, ...cucumberArgs], {
    env: runEnv,
    stdio: 'inherit',
    windowsHide: true
  });

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
}

main().catch((error: unknown) => {
  logger.error((error as Error).message);
  process.exitCode = 1;
});
