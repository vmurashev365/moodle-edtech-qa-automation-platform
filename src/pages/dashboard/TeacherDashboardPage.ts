import type { Locator } from '@playwright/test';
import { uiExpect } from '../../support/ui-expect';
import { BasePage } from '../base/BasePage';

export class TeacherDashboardPage extends BasePage {
  async open(): Promise<void> {
    await this.gotoPath('/my/');
    await this.waitForReady();
  }

  // Moodle 5 lists enrolled courses on My courses, reached from the Dashboard's primary navigation.
  async openMyCoursesFromDashboard(): Promise<void> {
    await uiExpect(this.page, 'Expected the teacher to be on the Moodle Dashboard.').toHaveURL(
      /\/my\/(?:index\.php)?(?:[?#].*)?$/
    );

    const myCoursesLink = this.myCoursesNavigationLink();

    await uiExpect(myCoursesLink, 'Expected the My courses primary navigation link to be visible.').toBeVisible();
    await myCoursesLink.click();
    await this.waitForReady();
    await this.expectUrlToContain('/my/courses.php');
  }

  async expectCourseVisible(courseName: string): Promise<void> {
    const courseLink = this.controlledCourseLink(courseName);

    await uiExpect(courseLink, `Expected teacher dashboard to show controlled course "${courseName}".`).toBeVisible();
  }

  async openCourse(courseName: string): Promise<void> {
    const courseLink = this.controlledCourseLink(courseName);

    await uiExpect(courseLink, `Expected controlled course "${courseName}" link to be visible.`).toBeVisible();
    await courseLink.click();
    await this.waitForReady();
  }

  private myCoursesNavigationLink(): Locator {
    return this.page.getByRole('menuitem', { name: /^My courses$/i }).first();
  }

  private controlledCourseLink(courseName: string): Locator {
    return this.page.getByRole('link', { name: this.courseLinkNameMatcher(courseName) }).first();
  }

  private courseLinkNameMatcher(courseName: string): RegExp {
    const courseNameWithoutNumericSuffix = courseName.replace(/\s+\d+$/, '').trim();

    return new RegExp(`(?:Course name\\s+)?${this.escapeForRegExp(courseNameWithoutNumericSuffix)}(?:\\s+\\d+)?`, 'i');
  }
}
