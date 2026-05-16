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
  note: 'Playwright is used by Cucumber step definitions. This repository does not use Playwright Test as the primary runner.',
  baseURL: env.baseUrl,
  browserLaunchOptions,
  browserContextOptions
};
