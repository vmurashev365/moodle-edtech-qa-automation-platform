import { setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { browserContextOptions, browserLaunchOptions } from '../../playwright.config';
import { MoodleClient } from '../api/clients/MoodleClient';
import type { EnvValidationResult, TestEnv } from './env';
import { loadEnv } from './env';

export interface ApiPreflightState {
  envValidation?: EnvValidationResult;
}

export class MoodleWorld extends World {
  readonly env: TestEnv;
  readonly moodleClient: MoodleClient;
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  apiPreflight: ApiPreflightState = {};

  constructor(options: IWorldOptions) {
    super(options);
    this.env = loadEnv();
    this.moodleClient = new MoodleClient(this.env);
  }

  async initBrowser(): Promise<void> {
    if (this.page) {
      return;
    }

    this.browser = await chromium.launch(browserLaunchOptions);
    this.context = await this.browser.newContext(browserContextOptions);
    this.page = await this.context.newPage();
  }

  requirePage(): Page {
    if (!this.page) {
      throw new Error('Pending implementation: browser page is not initialized for this scenario.');
    }

    return this.page;
  }

  async closeBrowser(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
    this.page = undefined;
    this.context = undefined;
    this.browser = undefined;
  }
}

setWorldConstructor(MoodleWorld);
