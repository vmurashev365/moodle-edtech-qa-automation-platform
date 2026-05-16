import type { Page } from 'playwright';
import { pendingImplementation } from '../../utils/assertions';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected pendingSelectors(action: string): never {
    pendingImplementation(`controlled Moodle selectors not verified yet for ${action}.`);
  }

  async gotoPath(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }
}
