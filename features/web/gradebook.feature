@web @teacher @student @gradebook @controlled-moodle @wip
Feature: Gradebook
  The gradebook should show the controlled student and assignment grade.

  Scenario: Gradebook shows controlled student and assignment grade
    Given teacher "teacher.qa" is signed in
    And student "student.qa" has grade "82 / 100" for "Essay: Test Automation Strategy"
    When the teacher opens the gradebook for "QA Automation Demo 101"
    Then the gradebook shows "82 / 100" for student "student.qa"
