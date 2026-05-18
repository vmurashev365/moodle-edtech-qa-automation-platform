@e2e @web @teacher @assignment @controlled-moodle @local @phase5
Feature: Teacher dashboard assignment review
  The teacher should be able to move from the dashboard into assignment submission review.

  Scenario: Teacher opens assignment submissions from the controlled course
    Given the controlled Moodle instance is available
    And controlled Moodle test data exists
    When I log in as the configured teacher user
    And I open the controlled course
    And I open the controlled assignment
    And I open the submissions view
    Then I should see the deterministic student submission
