@web @teacher @assignment @controlled-moodle @wip
Feature: Assignment submissions
  The assignment submissions page should be reachable for the teacher.

  Scenario: Assignment submissions page is reachable
    Given teacher "teacher.qa" is signed in
    And the teacher opens "My courses" from the dashboard
    And the teacher opens course "QA Automation Demo 101"
    When the teacher opens assignment submissions for "Essay: Test Automation Strategy"
    Then the submission from student "student.qa" is visible to the teacher
