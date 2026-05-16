@web @teacher @controlled-moodle @wip
Feature: Teacher dashboard
  The teacher dashboard should expose controlled course work.

  @smoke
  Scenario: Teacher dashboard shows controlled course
    Given teacher "teacher.qa" is signed in
    When the teacher opens the Moodle dashboard
    Then course "QA Automation Demo 101" is available to the teacher
