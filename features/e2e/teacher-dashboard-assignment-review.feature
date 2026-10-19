@e2e @web @teacher @assignment @controlled-moodle @local @phase5 @ungraded-baseline
Feature: Teacher dashboard assignment review
  The teacher should be able to click from the dashboard through My courses, the course and the assignment
  to the deterministic student's submission in the grading interface.

  Scenario: Teacher navigates from the dashboard to the deterministic submission ready for grading
    Given the controlled Moodle instance is available
    And controlled Moodle test data exists
    When I log in as the configured teacher user
    And I open My courses from the dashboard
    And I open the controlled course from My courses
    And I open the controlled assignment from the course page
    And I open the grading interface from the assignment page
    Then I should see the deterministic student submission
