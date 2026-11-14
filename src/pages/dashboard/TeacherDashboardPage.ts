import type { Locator } from '@playwright/test';
import { uiExpect } from '../../support/ui-expect';
import { BasePage } from '../base/BasePage';

const dashboardUrl = /\/my\/(?:index\.php)?(?:[?#].*)?$/;

// Moodle 5 primary navigation: the items a scenario may name, and the page each must lead to. A scenario
// that names anything else fails by name; add an item here together with the page it opens.
const primaryNavigation = new Map<string, RegExp>([
  ['Home', /\/\?redirect=0$/],
  ['Dashboard', dashboardUrl],
  ['My courses', /\/my\/courses\.php(?:[?#].*)?$/]
]);

export class TeacherDashboardPage extends BasePage {
  async open(): Promise<void> {
    await this.gotoPath('/my/');
    await this.waitForReady();
  }

  // Clicks an item of the primary navigation while on the Dashboard and requires the page that item opens.
  async openFromDashboard(itemLabel: string): Promise<void> {
    const destination = primaryNavigation.get(itemLabel);

    if (!destination) {
      const known = Array.from(primaryNavigation.keys())
        .map((label) => `"${label}"`)
        .join(', ');

      throw new Error(`"${itemLabel}" is not a known item of Moodle's main menu. Known items: ${known}.`);
    }

    await uiExpect(this.page, 'Expected the user to be on the Moodle Dashboard.').toHaveURL(dashboardUrl);

    const item = this.page.getByRole('menuitem', { name: itemLabel, exact: true }).first();

    await uiExpect(item, `Expected the "${itemLabel}" item of the main menu to be visible.`).toBeVisible();
    await item.click();
    await this.waitForReady();
    await uiExpect(this.page, `Expected "${itemLabel}" to open its page.`).toHaveURL(destination);
  }

  async expectCourseVisible(courseName: string): Promise<void> {
    const courseLink = this.courseLink(courseName);

    await uiExpect(courseLink, `Expected the page to list course "${courseName}".`).toBeVisible();
  }

  // Clicks the course where the current page lists it, for example on My courses.
  async openCourse(courseName: string): Promise<void> {
    const courseLink = this.courseLink(courseName);

    await uiExpect(
      courseLink,
      `Expected course "${courseName}" to be listed on this page; open "My courses" first.`
    ).toBeVisible();
    await courseLink.click();
    await this.waitForReady();
  }

  private courseLink(courseName: string): Locator {
    return this.page.getByRole('link', { name: this.courseLinkNameMatcher(courseName) }).first();
  }

  private courseLinkNameMatcher(courseName: string): RegExp {
    const courseNameWithoutNumericSuffix = courseName.replace(/\s+\d+$/, '').trim();

    return new RegExp(`(?:Course name\\s+)?${this.escapeForRegExp(courseNameWithoutNumericSuffix)}(?:\\s+\\d+)?`, 'i');
  }
}
