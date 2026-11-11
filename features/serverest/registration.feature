Feature: ServeRest user registration and login
  Use a unique synthetic account for each run and clean up only that account after the test.

  Scenario: [SR-01] Register a new user and log in
    Given I am on the ServeRest login page
    When I open the registration form
    And I register a new non-administrator user with a unique email and password
    Then I should be signed in
    When I log out
    And I log in with the new user's email and password
    Then I should be signed in on the home page
