@smoke @controlled-moodle @local @phase4 @moodle-login
Feature: Sign-in page
  Anyone who opens the site must be able to reach the sign-in form.

  Scenario: A visitor can reach the sign-in form
    When a visitor opens the login page
    Then the sign-in form is available
