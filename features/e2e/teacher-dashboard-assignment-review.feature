@e2e @web @teacher @assignment @controlled-moodle @local @phase5
Feature: Teacher dashboard assignment review
  A teacher must be able to get from the dashboard to a student's submitted work by clicking through
  My courses, the course and the assignment.

  Scenario: A teacher reaches a student's submission from the dashboard
    Given teacher "teacher.qa" is signed in
    And student "student.qa" has an ungraded submission for "Essay: Test Automation Strategy"
    When the teacher opens "My courses" from the dashboard
    And the teacher opens course "QA Automation Demo 101"
    And the teacher opens assignment "Essay: Test Automation Strategy"
    And the teacher opens grading for the assignment
    Then the teacher sees the submission from student "student.qa" as submitted and not graded
