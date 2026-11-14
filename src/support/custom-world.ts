import { setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { browserContextOptions, browserLaunchOptions } from '../../playwright.config';
import { MoodleClient } from '../api/clients/MoodleClient';
import type { AssignmentEntity, EntityRegistry, UserEntity } from '../domain/controlled-entities';
import type { GradingRequestResponse } from '../domain/access-comparison';
import { loadEntityRegistry } from './entity-registry';
import type { EnvValidationResult, TestEnv } from './env';
import { loadEnv } from './env';
import type { GradeStateResult } from './grade-state';
import { resolveRuntimeProfile, type RuntimeProfile } from './runtime-profile';
import { installClickVisualizer } from './screencast/click-visualizer';

export interface ApiPreflightState {
  envValidation?: EnvValidationResult;
}

export interface RoleAccessState {
  gradingPageStatus?: number;
  gradingRequestResponse?: GradingRequestResponse;
}

// The submission a scenario is about, set by the Given step that establishes it. Later steps that say
// "the submission" or "the gradebook shows ..." refer to it.
export interface SubmissionInFocus {
  student: UserEntity;
  assignment: AssignmentEntity;
  // The text the student handed in, as seeded.
  text: string;
  // What Moodle stored when the scenario established the submission: not graded.
  stateBefore: GradeStateResult;
}

export class MoodleWorld extends World {
  readonly env: TestEnv;
  readonly runtimeProfile: RuntimeProfile;
  readonly moodleClient: MoodleClient;
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  apiPreflight: ApiPreflightState = {};
  roleAccess: RoleAccessState = {};
  submissionInFocus?: SubmissionInFocus;
  // Set by the sign-in steps after the user menu confirmed who is signed in.
  signedIn?: UserEntity;
  private tracingStarted = false;
  private entityRegistry?: EntityRegistry;

  constructor(options: IWorldOptions) {
    super(options);
    this.env = loadEnv();
    this.runtimeProfile = resolveRuntimeProfile();
    this.moodleClient = new MoodleClient(this.env);
  }

  // Loaded on first use, so scenarios that name no seeded entity (API preflight, login smoke) need no seed.
  get entities(): EntityRegistry {
    this.entityRegistry ??= loadEntityRegistry();

    return this.entityRegistry;
  }

  requireSubmissionInFocus(): SubmissionInFocus {
    if (!this.submissionInFocus) {
      throw new Error(
        'This step refers to a submission, but the scenario has not established one. ' +
          'Start with: Given student "<username>" has an ungraded submission for "<assignment>".'
      );
    }

    return this.submissionInFocus;
  }

  // The submission in focus, provided the step names the student it belongs to.
  requireSubmissionOf(username: string): SubmissionInFocus {
    const submission = this.requireSubmissionInFocus();

    if (this.entities.student(username).id !== submission.student.id) {
      throw new Error(
        `The scenario established the submission of student "${submission.student.username}", but this step names student "${username}".`
      );
    }

    return submission;
  }

  requireSignedIn(): UserEntity {
    if (!this.signedIn) {
      throw new Error(
        'This step refers to the signed-in user, but nobody has signed in. ' +
          'Start with: Given teacher "<username>" is signed in, or Given student "<username>" is signed in.'
      );
    }

    return this.signedIn;
  }

  async initBrowser(): Promise<void> {
    if (this.page) {
      return;
    }

    this.browser = await chromium.launch(browserLaunchOptions);
    this.context = await this.browser.newContext(browserContextOptions);

    if (this.runtimeProfile.traceMode !== 'off') {
      await this.context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true
      });
      this.tracingStarted = true;
    }

    this.page = await this.context.newPage();

    if (this.runtimeProfile.clickVisualizerEnabled) {
      await installClickVisualizer(this.page);
    }
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

    const shouldSave =
      this.runtimeProfile.traceMode === 'on' || (this.runtimeProfile.traceMode === 'retain-on-failure' && failed);

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

  async getVideoPath(): Promise<string | undefined> {
    return this.page
      ?.video()
      ?.path()
      .catch(() => undefined);
  }

  shouldAttachVideo(failed: boolean): boolean {
    return this.runtimeProfile.videoMode === 'on' || (this.runtimeProfile.videoMode === 'retain-on-failure' && failed);
  }

  shouldDiscardVideo(failed: boolean): boolean {
    return this.runtimeProfile.videoMode === 'retain-on-failure' && !failed;
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
