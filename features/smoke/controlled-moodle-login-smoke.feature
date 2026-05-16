@smoke @controlled-moodle @local @phase4 @moodle-login
Feature: Controlled Moodle login smoke
  The local controlled Moodle instance should expose a reachable login page before deeper workflows run.

  Scenario: Controlled Moodle login page is reachable
    Given the controlled Moodle instance is available
    When I open the Moodle login page
    Then the Moodle login form should be visible
