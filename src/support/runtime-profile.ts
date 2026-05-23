import * as dotenv from 'dotenv';

dotenv.config();

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

function clean(value: string | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function readExecutionProfile(): { name: ExecutionProfileName; explicit: boolean } {
  const rawProfile = clean(process.env.MOODLE_EXECUTION_PROFILE)?.toLowerCase();

  if (rawProfile === 'demo' || rawProfile === 'fast') {
    return { name: rawProfile, explicit: true };
  }

  if (rawProfile) {
    throw new Error(`MOODLE_EXECUTION_PROFILE must be "demo" or "fast"; received "${rawProfile}".`);
  }

  return { name: 'fast', explicit: false };
}

function readBoolean(name: string): boolean | undefined {
  const value = clean(process.env[name])?.toLowerCase();

  if (value === undefined) {
    return undefined;
  }

  if (['1', 'true', 'yes', 'on'].includes(value)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(value)) {
    return false;
  }

  return undefined;
}

function readNumber(name: string): number | undefined {
  const value = clean(process.env[name]);

  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function readTraceMode(defaultValue: TraceMode, explicitProfile: boolean): TraceMode {
  const rawMode =
    clean(process.env.MOODLE_TRACE_MODE)?.toLowerCase() ??
    (!explicitProfile ? clean(process.env.TRACE_MODE)?.toLowerCase() : undefined);

  if (rawMode === 'off' || rawMode === 'retain-on-failure' || rawMode === 'on') {
    return rawMode;
  }

  if (rawMode === 'all') {
    return 'on';
  }

  return defaultValue;
}

function readVideoMode(defaultValue: VideoMode, explicitProfile: boolean): VideoMode {
  const rawMode = clean(process.env.MOODLE_VIDEO_MODE)?.toLowerCase();

  if (rawMode === 'off' || rawMode === 'retain-on-failure' || rawMode === 'on') {
    return rawMode;
  }

  if (!explicitProfile && readBoolean('VIDEO_ON_FAILURE') === true) {
    return 'retain-on-failure';
  }

  return defaultValue;
}

export function resolveRuntimeProfile(): RuntimeProfile {
  const executionProfile = readExecutionProfile();
  const defaults = defaultsByProfile[executionProfile.name];
  const screencastEnabled = readBoolean('MOODLE_SCREENCAST') ?? defaults.screencastEnabled;
  const headless =
    readBoolean('MOODLE_HEADLESS') ??
    (!executionProfile.explicit ? readBoolean('HEADLESS') : undefined) ??
    defaults.headless;
  const videoMode = screencastEnabled ? 'on' : readVideoMode(defaults.videoMode, executionProfile.explicit);
  const traceMode = screencastEnabled ? 'on' : readTraceMode(defaults.traceMode, executionProfile.explicit);

  return {
    name: executionProfile.name,
    headless,
    slowMoMs: readNumber('MOODLE_SLOW_MO_MS') ?? defaults.slowMoMs,
    stepDelayMs: readNumber('MOODLE_STEP_DELAY_MS') ?? defaults.stepDelayMs,
    screencastEnabled,
    traceMode,
    videoMode,
    terminalStepsEnabled: readBoolean('MOODLE_TERMINAL_STEPS') ?? defaults.terminalStepsEnabled,
    clickVisualizerEnabled: executionProfile.name === 'demo' || screencastEnabled
  };
}
