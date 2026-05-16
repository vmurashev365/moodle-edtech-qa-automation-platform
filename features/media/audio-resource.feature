@media @web @student @controlled-moodle @wip
Feature: Audio resource
  Moodle audio learning resources should expose usable controls to the learner.

  Scenario: Student opens audio resource and controls are visible
    Given student "student.qa" is signed in
    When the student opens audio resource "Sample Listening Task"
    Then audio controls are visible for the student
