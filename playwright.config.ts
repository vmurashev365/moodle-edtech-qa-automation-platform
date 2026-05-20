import type { BrowserContextOptions, LaunchOptions } from 'playwright';
import { loadEnv } from './src/support/env';

const env = loadEnv();

export const browserLaunchOptions: LaunchOptions = {
  headless: env.headless
};

export const browserContextOptions: BrowserContextOptions = {
  baseURL: env.baseUrl,
  viewport: {
    width: 1366,
    height: 768
  },
  recordVideo: env.videoOnFailure
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
