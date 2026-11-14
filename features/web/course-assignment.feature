@web @teacher @assignment @controlled-moodle @wip
Feature: Course assignment access
  The controlled course should expose the planned assignment.

  Scenario: Course shows controlled assignment
    Given teacher "teacher.qa" is signed in
    When the teacher opens "My courses" from the dashboard
    And the teacher opens course "QA Automation Demo 101"
    Then assignment "Essay: Test Automation Strategy" is available in the course
