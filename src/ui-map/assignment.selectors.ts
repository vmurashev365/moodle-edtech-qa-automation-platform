export const assignmentSelectors = {
  assignmentPage: {
    mainRegion: '#region-main, main[role="main"]',
    assignmentTitle: 'h1, .page-header-headings h1',
    submissionsAction: 'a[href*="action=grading"], input[name="grade"], button[name="grade"]',
    submissionsTable: 'table#attempts, table.generaltable',
    gradeInput: 'input[name*="grade"], input[id*="grade"]',
    saveGradeAction: 'input[type="submit"], button[type="submit"]'
  }
} as const;
