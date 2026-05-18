import type { Page } from 'playwright';
import { assertTrue, pendingImplementation } from '../../utils/assertions';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected pendingSelectors(action: string): never {
    pendingImplementation(`controlled Moodle selectors not verified yet for ${action}.`);
  }

  async gotoPath(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async gotoUrl(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForReady();
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  protected async expectVisibleText(text: string, description: string): Promise<void> {
    const locator = this.page.getByText(text, { exact: false }).first();
    const visible = await locator.isVisible({ timeout: 10000 }).catch(() => false);

    assertTrue(visible, `Expected ${description} to include visible text "${text}".`);
  }
}
