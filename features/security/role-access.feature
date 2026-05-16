@security @student @teacher @assignment @controlled-moodle @wip
Feature: Role based access
  Student users must not be able to access teacher-only grading workflows.

  @smoke
  Scenario: Student cannot access teacher-only grading workflow
    Given student "student.qa" is signed in
    When the student attempts to open teacher-only grading for "Essay: Test Automation Strategy"
    Then access to teacher grading is denied
