export const courseSelectors = {
  coursePage: {
    mainRegion: '#region-main, main[role="main"]',
    courseTitle: 'h1, .page-header-headings h1',
    assignmentLink: 'a[href*="/mod/assign/view.php"]'
  }
} as const;
