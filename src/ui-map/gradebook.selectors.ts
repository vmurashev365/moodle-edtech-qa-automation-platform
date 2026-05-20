// Pending gradebook contracts stay explicitly legacy/pending until Recorder
// or Codegen evidence verifies real Moodle selectors.
export const gradebookLegacySelectors = {
  gradebookPage: {
    gradebookTable: 'pending: gradebook table locator to be verified',
    studentGradeCell: 'pending: student grade cell locator to be verified'
  }
} as const;
