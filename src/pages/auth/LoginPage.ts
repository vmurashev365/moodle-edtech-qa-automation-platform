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
    const credentials = this.credentialsFor(role, env);

    await this.open();

    const username = this.page.locator(authSelectors.loginPage.usernameField).first();
    const password = this.page.locator(authSelectors.loginPage.passwordField).first();
    const submit = this.page.locator(authSelectors.loginPage.submitAction).first();

    if (!(await username.isVisible({ timeout: 5000 }).catch(() => false))) {
      await this.expectAuthenticated();
      return;
    }

    await username.fill(credentials.username);
    await password.fill(credentials.password);
    await submit.click();
    await this.waitForReady();
    await this.expectAuthenticated();
  }

  async expectAuthenticated(): Promise<void> {
    const userMenu = this.page.locator(authSelectors.authenticatedPage.userMenu).first();
    const dashboardLink = this.page.locator(authSelectors.authenticatedPage.dashboardLink).first();

    if (
      (await userMenu.isVisible({ timeout: 10000 }).catch(() => false)) ||
      (await dashboardLink.isVisible({ timeout: 2000 }).catch(() => false))
    ) {
      return;
    }

    const loginError = this.page.locator(authSelectors.loginPage.loginError).first();
    const errorText = (await loginError.textContent().catch(() => undefined))?.trim();

    throw new Error(
      errorText
        ? `Moodle login failed: ${errorText}`
        : 'Moodle login did not reach an authenticated dashboard or user menu.'
    );
  }

  private credentialsFor(role: 'teacher' | 'student' | 'manager' | 'admin', env: TestEnv): {
    username: string;
    password: string;
  } {
    if (role === 'teacher') {
      return { username: env.teacherUsername, password: env.teacherPassword };
    }

    if (role === 'student') {
      return { username: env.studentUsername, password: env.studentPassword };
    }

    if (role === 'manager') {
      return { username: env.managerUsername, password: env.managerPassword };
    }

    return { username: env.adminUsername, password: env.adminPassword };
  }
}
