@api @smoke @controlled-moodle
Feature: Controlled Moodle API preflight
  The skeleton should validate the controlled Moodle environment contract before API helpers are implemented.

  Scenario: Controlled Moodle API preflight validates environment readiness
    Given the controlled Moodle environment configuration is loaded
    When I validate the Moodle API preflight contract
    Then the preflight result should confirm the base URL and controlled data names
    And the preflight result should report the API token status consistently with the environment
