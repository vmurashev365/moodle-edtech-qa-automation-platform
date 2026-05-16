@e2e @web @teacher @assignment @controlled-moodle @wip
Feature: Teacher dashboard assignment review
  The teacher should be able to move from the dashboard into assignment submission review.

  Scenario: Teacher opens assignment submissions from the controlled course
    Given teacher "teacher.qa" is signed in
    When the teacher opens the Moodle dashboard
    And the teacher opens course "QA Automation Demo 101"
    And the teacher opens assignment "Essay: Test Automation Strategy"
    Then the submission from student "student.qa" is visible to the teacher
