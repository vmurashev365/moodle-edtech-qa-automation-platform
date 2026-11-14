import type { Locator } from '@playwright/test';
import { uiExpect } from '../../support/ui-expect';
import { BasePage } from '../base/BasePage';

export class CoursePage extends BasePage {
  async openCourse(courseName: string): Promise<void> {
    const courseLink = this.controlledCourseLink(courseName);

    await uiExpect(courseLink, `Expected course link "${courseName}" to be visible before navigation.`).toBeVisible();
    await courseLink.click();
    await this.waitForReady();
  }

  async expectAssignmentVisible(assignmentName: string): Promise<void> {
    const assignment = this.assignmentLink(assignmentName);

    await uiExpect(
      assignment,
      `Expected controlled assignment "${assignmentName}" to be visible in the course.`
    ).toBeVisible();
  }

  async expectCourseContext(courseName: string): Promise<void> {
    const courseHeading = this.page.getByRole('heading', { name: this.textMatcher(courseName) }).first();

    await uiExpect(courseHeading, `Expected controlled course page heading to show "${courseName}".`).toBeVisible();
  }

  private controlledCourseLink(courseName: string): Locator {
    return this.page.getByRole('link', { name: this.courseLinkNameMatcher(courseName) }).first();
  }

  private assignmentLink(assignmentName: string): Locator {
    return this.page.getByRole('link', { name: this.assignmentLinkNameMatcher(assignmentName) }).first();
  }

  private courseLinkNameMatcher(courseName: string): RegExp {
    const courseNameWithoutNumericSuffix = courseName.replace(/\s+\d+$/, '').trim();

    return new RegExp(`(?:Course name\\s+)?${this.escapeForRegExp(courseNameWithoutNumericSuffix)}(?:\\s+\\d+)?`, 'i');
  }

  private assignmentLinkNameMatcher(assignmentName: string): RegExp {
    return new RegExp(`${this.escapeForRegExp(assignmentName)}(?:\\s+Assignment)?`, 'i');
  }
}
