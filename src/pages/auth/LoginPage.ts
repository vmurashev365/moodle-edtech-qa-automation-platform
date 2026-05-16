import type { TestEnv } from '../../support/env';
import { authSelectors } from '../../ui-map/auth.selectors';
import { BasePage } from '../base/BasePage';

export class LoginPage extends BasePage {
  async signInAs(role: 'teacher' | 'student' | 'manager' | 'admin', env: TestEnv): Promise<void> {
    void role;
    void env;
    void authSelectors;
    this.pendingSelectors('Moodle login');
  }
}
