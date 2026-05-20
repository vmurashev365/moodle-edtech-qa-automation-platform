import { setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
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
  private tracingStarted = false;

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

    if (this.env.traceMode !== 'off') {
      await this.context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true
      });
      this.tracingStarted = true;
    }

    this.page = await this.context.newPage();
  }

  requirePage(): Page {
    if (!this.page) {
      throw new Error('Pending implementation: browser page is not initialized for this scenario.');
    }

    return this.page;
  }

  async stopTracing(scenarioName: string, failed: boolean): Promise<string | undefined> {
    if (!this.context || !this.tracingStarted) {
      return undefined;
    }

    const shouldSave = this.env.traceMode === 'on' || (this.env.traceMode === 'retain-on-failure' && failed);

    try {
      if (!shouldSave) {
        await this.context.tracing.stop();
        return undefined;
      }

      mkdirSync('traces', { recursive: true });
      const tracePath = path.resolve('traces', `${this.safeEvidenceName(scenarioName)}-trace.zip`);
      await this.context.tracing.stop({ path: tracePath });
      return tracePath;
    } finally {
      this.tracingStarted = false;
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.context && this.tracingStarted) {
      await this.context.tracing.stop().catch(() => undefined);
      this.tracingStarted = false;
    }

    await this.context?.close();
    await this.browser?.close();
    this.page = undefined;
    this.context = undefined;
    this.browser = undefined;
  }

  private safeEvidenceName(name: string): string {
    const safeName = name
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    return safeName || 'scenario';
  }
}

setWorldConstructor(MoodleWorld);
