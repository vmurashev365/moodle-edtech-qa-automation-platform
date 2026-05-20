// Moodle CSS contracts are fallback-only. Page Objects should prefer
// user-facing role/text locators before using these Moodle-specific hooks.
export const courseLegacySelectors = {
  coursePage: {
    mainRegion: '#region-main, main[role="main"]',
    courseTitle: 'h1, .page-header-headings h1',
    assignmentLink: 'a[href*="/mod/assign/view.php"]'
  }
} as const;
