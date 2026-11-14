import type { Locator } from '@playwright/test';
import { uiExpect } from '../../support/ui-expect';
import { BasePage } from '../base/BasePage';

// Moodle's own login error box.
const loginErrorSelector = '#loginerrormessage, .loginerrors, .alert-danger';
// core/togglesensitive wraps the password input in this container once it has replaced it.
const passwordToggleWrappedFieldSelector = '.toggle-sensitive-wrapper #password';

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
      const loginError = this.page.locator(loginErrorSelector).first();
      // Short optional read for Moodle's own login error. Assertion timing stays centralized in uiExpect.
      const errorText = (await loginError.textContent({ timeout: 1000 }).catch(() => undefined))?.trim();

      throw new Error(
        errorText
          ? `Moodle login failed: ${errorText}`
          : 'Moodle login did not reach an authenticated dashboard or user menu.'
      );
    }
  }

  // The user menu avatar carries the signed-in user's full name (Moodle renders initials with that name as
  // aria-label for users without a picture), so it identifies who is signed in on any standard-layout page.
  async expectSignedInAs(displayName: string): Promise<void> {
    const userMenu = this.userMenuToggle();

    await uiExpect(
      userMenu,
      `Expected Moodle to show the user menu of "${displayName}", but this page shows no user menu ` +
        '(no user is signed in, or the page is not a standard Moodle page).'
    ).toBeVisible();

    try {
      await uiExpect(userMenu.getByRole('img', { name: displayName, exact: true })).toBeVisible();
    } catch {
      // Short optional read of the actual identity for the failure message. Assertion timing stays in uiExpect.
      const actualName = await userMenu
        .getByRole('img')
        .first()
        .getAttribute('aria-label', { timeout: 1000 })
        .catch(() => null);

      throw new Error(
        `Expected Moodle to be signed in as "${displayName}", but the user menu belongs to ` +
          `${actualName ? `"${actualName}"` : 'an unidentified user'}.`
      );
    }
  }

  // The name the user menu carries, for comparison evidence. null: no user menu, or it names nobody.
  async readSignedInUserName(): Promise<string | null> {
    return this.readAttribute(this.userMenuToggle().getByRole('img').first(), 'aria-label');
  }

  isOnLoginPage(): boolean {
    return new URL(this.page.url()).pathname.endsWith('/login/index.php');
  }

  // Moodle sends signed-out users to /login/index.php, where teacher-only controls are absent as well, so a
  // missing control proves nothing unless this holds.
  expectNotOnLoginPage(): void {
    const currentUrl = this.page.url();

    if (this.isOnLoginPage()) {
      throw new Error(
        `Expected a signed-in Moodle page, but Moodle redirected to its login page (${currentUrl}), so no user is signed in.`
      );
    }
  }

  async expectLoginFormAbsent(): Promise<void> {
    await uiExpect(this.usernameField(), 'Expected no Moodle login username field on this page.').toHaveCount(0);
    await uiExpect(this.passwordField(), 'Expected no Moodle login password field on this page.').toHaveCount(0);
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
      this.page.locator(passwordToggleWrappedFieldSelector),
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
