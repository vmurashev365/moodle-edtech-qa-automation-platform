export const dashboardSelectors = {
  dashboardPage: {
    mainRegion: '#region-main, main[role="main"]',
    courseCard: '[data-region="course-content"], .coursebox, .dashboard-card',
    courseLink: 'a[href*="/course/view.php"]'
  }
} as const;
