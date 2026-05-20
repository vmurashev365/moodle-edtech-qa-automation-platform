import type { Page } from '@playwright/test';
import { uiExpect } from '../../support/ui-expect';
import { pendingImplementation } from '../../utils/assertions';

export class BasePage {
  constructor(protected readonly page: Page) {}

  protected pendingSelectors(action: string): never {
    pendingImplementation(`controlled Moodle selectors not verified yet for ${action}.`);
  }

  async goto(pathOrAbsoluteUrl: string): Promise<void> {
    await this.page.goto(pathOrAbsoluteUrl);
    await this.waitForReady();
  }

  async gotoPath(path: string): Promise<void> {
    await this.goto(path);
  }

  async gotoUrl(url: string): Promise<void> {
    await this.goto(url);
  }

  async expectUrlToContain(fragment: string): Promise<void> {
    await uiExpect(this.page).toHaveURL(new RegExp(this.escapeForRegExp(fragment)));
  }

  async expectTitleToContain(expected: string): Promise<void> {
    await uiExpect(this.page).toHaveTitle(new RegExp(this.escapeForRegExp(expected)));
  }

  getCurrentUrl(): string {
    return this.page.url();
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  protected async expectVisibleText(text: string, description: string): Promise<void> {
    const locator = this.page.getByText(text, { exact: false }).first();

    await uiExpect(locator, `Expected ${description} to include visible text "${text}".`).toBeVisible();
  }

  protected textMatcher(text: string): RegExp {
    return new RegExp(this.escapeForRegExp(text), 'i');
  }

  protected escapeForRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
