import type { TestEnv } from '../../support/env';
import { authSelectors } from '../../ui-map/auth.selectors';
import { assertTrue } from '../../utils/assertions';
import { BasePage } from '../base/BasePage';

export class LoginPage extends BasePage {
  async open(): Promise<void> {
    await this.gotoPath('/login/index.php');
    await this.waitForReady();
  }

  async expectLoginFormVisible(): Promise<void> {
    const username = this.page.locator(authSelectors.loginPage.usernameField).first();
    const password = this.page.locator(authSelectors.loginPage.passwordField).first();
    const submit = this.page.locator(authSelectors.loginPage.submitAction).first();

    assertTrue(await username.isVisible(), 'Expected Moodle login username field to be visible.');
    assertTrue(await password.isVisible(), 'Expected Moodle login password field to be visible.');
    assertTrue(await submit.isVisible(), 'Expected Moodle login submit action to be visible.');
  }

  async signInAs(role: 'teacher' | 'student' | 'manager' | 'admin', env: TestEnv): Promise<void> {
    void role;
    void env;
    void authSelectors;
    this.pendingSelectors('Moodle login');
  }
}
