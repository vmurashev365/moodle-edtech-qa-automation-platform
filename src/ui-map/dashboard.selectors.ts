// Moodle CSS contracts are fallback-only. Page Objects should prefer
// user-facing role/text locators before using these Moodle-specific hooks.
export const dashboardLegacySelectors = {
  dashboardPage: {
    mainRegion: '#region-main, main[role="main"]',
    courseCard: '[data-region="course-content"], .coursebox, .dashboard-card',
    courseLink: 'a[href*="/course/view.php"]'
  }
} as const;
