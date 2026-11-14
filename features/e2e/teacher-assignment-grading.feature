@e2e @teacher @student @assignment @gradebook @controlled-moodle @local @phase6
Feature: Teacher assignment grading
  A grade that a teacher saves for a student's submission must reach the gradebook unchanged.

  Scenario: A grade saved by the teacher reaches the gradebook unchanged
    Given teacher "teacher.qa" is signed in
    And student "student.qa" has an ungraded submission for "Essay: Test Automation Strategy"
    When the teacher grades the submission from student "student.qa" as "82"
    And the teacher opens the gradebook for "QA Automation Demo 101"
    Then the gradebook shows "82.00" for student "student.qa"
    And the grade recorded for student "student.qa" is "82" in both the assignment and the gradebook
