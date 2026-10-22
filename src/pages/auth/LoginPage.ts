import type { Locator } from '@playwright/test';
import type { TestEnv } from '../../support/env';
import { uiExpect } from '../../support/ui-expect';
import { authLegacySelectors } from '../../ui-map/auth.selectors';
import { BasePage } from '../base/BasePage';

export class LoginPage extends BasePage {
  async open(): Promise<void> {
    await this.gotoPath('/login/index.php');
    await this.waitForReady();
  }

  async expectLoginFormVisible(): Promise<void> {
    await uiExpect(this.usernameField(), 'Expected Moodle login username field to be visible.').toBeVisible();
    await uiExpect(this.passwordField(), 'Expected Moodle login password field to be visible.').toBeVisible();
    await uiExpect(this.submitAction(), 'Expected Moodle login submit action to be visible.').toBeVisible();
  }

  async signInAs(role: 'teacher' | 'student' | 'manager' | 'admin', env: TestEnv): Promise<void> {
    const credentials = this.credentialsFor(role, env);

    await this.login(credentials.username, credentials.password);
  }

  async login(username: string, password: string): Promise<void> {
    await this.open();
    await this.expectLoginFormVisible();
    await this.waitForPasswordToggleIfEnabled();

    await this.fillVisibleField(this.usernameField(), username, 'Moodle login username field');
    await this.fillVisibleField(this.passwordField(), password, 'Moodle login password field');
    await this.expectPasswordFieldKeepsValue(password);
    await this.clickVisibleAction(this.submitAction(), 'Moodle login submit action');
    await this.waitForReady();
    await this.expectAuthenticated();
  }

  async expectAuthenticated(): Promise<void> {
    const authenticatedTarget = this.userMenuToggle();

    try {
      await uiExpect(
        authenticatedTarget,
        'Expected Moodle to show an authenticated user menu after login.'
      ).toBeVisible();
    } catch {
      const loginError = this.page.locator(authLegacySelectors.loginPage.loginError).first();
      // Short optional read for Moodle's own login error. Assertion timing stays centralized in uiExpect.
      const errorText = (await loginError.textContent({ timeout: 1000 }).catch(() => undefined))?.trim();

      throw new Error(
        errorText
          ? `Moodle login failed: ${errorText}`
          : 'Moodle login did not reach an authenticated dashboard or user menu.'
      );
    }
  }

  // When the loginpasswordtoggle admin setting is on, Moodle's core/togglesensitive module re-renders
  // #password from its outerHTML after page load. A password typed before that swap is silently dropped
  // and the form posts an empty password, so wait for the swap whenever the page initialises the module.
  private async waitForPasswordToggleIfEnabled(): Promise<void> {
    const toggleInitialised = await this.page.evaluate(() =>
      Array.from(document.scripts).some((script) => script.text.includes('core/togglesensitive'))
    );

    if (!toggleInitialised) {
      return;
    }

    await uiExpect(
      this.page.locator(authLegacySelectors.loginPage.passwordToggleWrappedField),
      'Expected Moodle password visibility toggle to finish replacing the password field before typing.'
    ).toBeAttached();
  }

  // Compares inside the poll instead of using toHaveValue, whose failure message would print the password.
  private async expectPasswordFieldKeepsValue(password: string): Promise<void> {
    await uiExpect
      .poll(async () => (await this.passwordField().inputValue()) === password, {
        message: 'Expected the Moodle password field to keep the typed password until the form is submitted.'
      })
      .toBe(true);
  }

  private credentialsFor(
    role: 'teacher' | 'student' | 'manager' | 'admin',
    env: TestEnv
  ): {
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

  private usernameField(): Locator {
    return this.page.getByRole('textbox', { name: /username/i }).first();
  }

  private passwordField(): Locator {
    return this.page.getByRole('textbox', { name: /password/i }).first();
  }

  private submitAction(): Locator {
    return this.page.getByRole('button', { name: /log in|login/i }).first();
  }

  private userMenuToggle(): Locator {
    return this.page.getByRole('button', { name: /user menu/i }).first();
  }

  private async fillVisibleField(field: Locator, value: string, description: string): Promise<void> {
    await uiExpect(field, `Expected ${description} to be visible.`).toBeVisible();
    await field.fill(value);
  }

  private async clickVisibleAction(action: Locator, description: string): Promise<void> {
    await uiExpect(action, `Expected ${description} to be visible.`).toBeVisible();
    await action.click();
  }
}
