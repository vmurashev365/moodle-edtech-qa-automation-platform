@security @student @teacher @assignment @controlled-moodle @local @phase7
Feature: Role based access
  A student must not be able to grade, neither on the grading page nor by any other route.

  Rule: Only a teacher can grade a submission

    @smoke
    Scenario: A student cannot open the grading page
      Given student "student.qa" is signed in
      And student "student.qa" has an ungraded submission for "Essay: Test Automation Strategy"
      When the student tries to open the grading page for that submission
      Then Moodle refuses with a permission error

    Scenario: A student cannot save a grade by sending the grading request directly
      Given student "student.qa" is signed in
      And student "student.qa" has an ungraded submission for "Essay: Test Automation Strategy"
      When the student sends the grading request for that submission with grade "82"
      Then Moodle refuses with a permission error for grading
      And the submission from student "student.qa" is still not graded
