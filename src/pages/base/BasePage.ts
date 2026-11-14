import type { Locator, Page } from '@playwright/test';
import { uiExpect } from '../../support/ui-expect';
import { pendingImplementation } from '../../utils/assertions';

// For reading what a page shows after the assertions have already waited for it.
const observationTimeoutMs = 1000;

export class BasePage {
  constructor(protected readonly page: Page) {}

  // Readers for comparison evidence. An element that is not on the page is reported as null, which fails the
  // check that uses it; reading never throws and never decides a verdict on its own.
  protected async readText(locator: Locator): Promise<string | null> {
    return locator.textContent({ timeout: observationTimeoutMs }).catch(() => null);
  }

  // The element's own text without the text of child elements such as avatars, icons or menus.
  protected async readOwnText(locator: Locator): Promise<string | null> {
    return locator
      .evaluate(
        (element) =>
          Array.from(element.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent ?? '')
            .join(' '),
        undefined,
        { timeout: observationTimeoutMs }
      )
      .catch(() => null);
  }

  protected async readAttribute(locator: Locator, name: string): Promise<string | null> {
    return locator.getAttribute(name, { timeout: observationTimeoutMs }).catch(() => null);
  }

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
