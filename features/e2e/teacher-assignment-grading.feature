@e2e @teacher @student @assignment @gradebook @controlled-moodle @phase6 @wip
Feature: Teacher assignment grading
  The controlled Moodle workflow should protect grade save and gradebook reconciliation.

  @smoke
  Scenario: Teacher grades deterministic student submission and gradebook reflects grade
    Given the controlled course has a submitted assignment ready for grading
    And teacher "teacher.qa" is signed in
    When the teacher grades the deterministic submission as "82 / 100"
    Then the assignment grade and gradebook grade are reconciled for student "student.qa"
