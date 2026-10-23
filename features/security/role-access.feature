@security @student @teacher @assignment @controlled-moodle @local @phase7
Feature: Role based access
  Student users must not be able to access teacher-only grading workflows.

  @smoke
  Scenario: Student cannot access teacher-only grading workflow
    Given student "student.qa" is signed in
    When the student attempts to open teacher-only grading for "Essay: Test Automation Strategy"
    Then access to teacher grading is denied

  @ungraded-baseline
  Scenario: Student cannot submit a grade through Moodle's grading service
    Given student "student.qa" is signed in
    When the student attempts to submit a grade for "Essay: Test Automation Strategy" through Moodle's grading service
    Then Moodle rejects the grade submission for lack of grading permission
    And the deterministic student grade is still not graded in Moodle
