import * as dotenv from 'dotenv';
import { cleanEnvValue, readBooleanEnv, readChoiceEnv, readIntegerEnv } from './env-values';

dotenv.config({ quiet: true });

export type ExecutionProfileName = 'demo' | 'fast';
export type TraceMode = 'off' | 'retain-on-failure' | 'on';
export type VideoMode = 'off' | 'retain-on-failure' | 'on';

export interface RuntimeProfile {
  name: ExecutionProfileName;
  headless: boolean;
  slowMoMs: number;
  stepDelayMs: number;
  screencastEnabled: boolean;
  traceMode: TraceMode;
  videoMode: VideoMode;
  terminalStepsEnabled: boolean;
  clickVisualizerEnabled: boolean;
}

interface RuntimeProfileDefaults {
  headless: boolean;
  slowMoMs: number;
  stepDelayMs: number;
  screencastEnabled: boolean;
  traceMode: TraceMode;
  videoMode: VideoMode;
  terminalStepsEnabled: boolean;
}

const defaultsByProfile: Record<ExecutionProfileName, RuntimeProfileDefaults> = {
  demo: {
    headless: false,
    slowMoMs: 200,
    stepDelayMs: 350,
    screencastEnabled: false,
    traceMode: 'retain-on-failure',
    videoMode: 'off',
    terminalStepsEnabled: true
  },
  fast: {
    headless: true,
    slowMoMs: 0,
    stepDelayMs: 0,
    screencastEnabled: false,
    traceMode: 'retain-on-failure',
    videoMode: 'off',
    terminalStepsEnabled: false
  }
};

const traceModes = ['off', 'retain-on-failure', 'on'] as const;
const videoModes = ['off', 'retain-on-failure', 'on'] as const;

function readExecutionProfile(env: NodeJS.ProcessEnv): { name: ExecutionProfileName; explicit: boolean } {
  const rawProfile = cleanEnvValue(env.MOODLE_EXECUTION_PROFILE)?.toLowerCase();

  if (rawProfile === 'demo' || rawProfile === 'fast') {
    return { name: rawProfile, explicit: true };
  }

  if (rawProfile) {
    throw new Error(`MOODLE_EXECUTION_PROFILE must be "demo" or "fast"; received "${rawProfile}".`);
  }

  return { name: 'fast', explicit: false };
}

function readTraceMode(env: NodeJS.ProcessEnv, defaultValue: TraceMode, explicitProfile: boolean): TraceMode {
  const aliases = { all: 'on' } as const;

  return (
    readChoiceEnv(env, 'MOODLE_TRACE_MODE', traceModes, aliases) ??
    (!explicitProfile ? readChoiceEnv(env, 'TRACE_MODE', traceModes, aliases) : undefined) ??
    defaultValue
  );
}

function readVideoMode(env: NodeJS.ProcessEnv, defaultValue: VideoMode, explicitProfile: boolean): VideoMode {
  const videoMode = readChoiceEnv(env, 'MOODLE_VIDEO_MODE', videoModes);

  if (videoMode) {
    return videoMode;
  }

  if (!explicitProfile && readBooleanEnv(env, 'VIDEO_ON_FAILURE') === true) {
    return 'retain-on-failure';
  }

  return defaultValue;
}

// Single source of truth for the runtime profile. The Cucumber World, Playwright config and the
// run-cucumber-profile snapshot all resolve it from the environment the browser process receives.
export function resolveRuntimeProfile(env: NodeJS.ProcessEnv = process.env): RuntimeProfile {
  const executionProfile = readExecutionProfile(env);
  const defaults = defaultsByProfile[executionProfile.name];
  const screencastEnabled = readBooleanEnv(env, 'MOODLE_SCREENCAST') ?? defaults.screencastEnabled;
  const headless =
    readBooleanEnv(env, 'MOODLE_HEADLESS') ??
    (!executionProfile.explicit ? readBooleanEnv(env, 'HEADLESS') : undefined) ??
    defaults.headless;
  const videoMode = screencastEnabled ? 'on' : readVideoMode(env, defaults.videoMode, executionProfile.explicit);
  const traceMode = screencastEnabled ? 'on' : readTraceMode(env, defaults.traceMode, executionProfile.explicit);

  return {
    name: executionProfile.name,
    headless,
    slowMoMs: readIntegerEnv(env, 'MOODLE_SLOW_MO_MS', { min: 0 }) ?? defaults.slowMoMs,
    stepDelayMs: readIntegerEnv(env, 'MOODLE_STEP_DELAY_MS', { min: 0 }) ?? defaults.stepDelayMs,
    screencastEnabled,
    traceMode,
    videoMode,
    terminalStepsEnabled: readBooleanEnv(env, 'MOODLE_TERMINAL_STEPS') ?? defaults.terminalStepsEnabled,
    clickVisualizerEnabled: executionProfile.name === 'demo' || screencastEnabled
  };
}
