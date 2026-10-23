@e2e @teacher @student @assignment @gradebook @controlled-moodle @local @phase6 @ungraded-baseline
Feature: Teacher assignment grading
  The controlled Moodle workflow should protect grade save and gradebook reconciliation.

  Scenario: Teacher grades deterministic student submission and gradebook reflects grade
    Given the controlled Moodle instance is available
    And controlled Moodle grading test data exists
    When I log in as the configured teacher user
    And I open the controlled assignment grading interface
    And I grade the deterministic student submission with the target grade
    And I open the controlled gradebook
    Then the gradebook should show the target grade for the deterministic student
    And Moodle should store the target grade for the deterministic student
