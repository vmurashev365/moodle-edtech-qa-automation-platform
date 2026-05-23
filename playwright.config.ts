import type { BrowserContextOptions, LaunchOptions } from 'playwright';
import { loadEnv } from './src/support/env';
import { resolveRuntimeProfile } from './src/support/runtime-profile';

const env = loadEnv();
const runtimeProfile = resolveRuntimeProfile();

export const browserLaunchOptions: LaunchOptions = {
  headless: runtimeProfile.headless,
  slowMo: runtimeProfile.slowMoMs
};

export const browserContextOptions: BrowserContextOptions = {
  baseURL: env.baseUrl,
  viewport: {
    width: 1366,
    height: 768
  },
  recordVideo:
    runtimeProfile.videoMode !== 'off'
      ? {
          dir: 'videos'
        }
      : undefined,
  ignoreHTTPSErrors: true
};

export default {
  baseURL: env.baseUrl,
  browserLaunchOptions,
  browserContextOptions
};
