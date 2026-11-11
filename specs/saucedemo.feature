Feature: Sauce Demo E-commerce Application
  As a user
  I want to authenticate, browse products, and complete checkout
  So that I can purchase items from the Sauce Demo store

  Scenario: [SL-01] Valid login with standard credentials
    Given I am on the Sauce Demo login page
    When I enter username "standard_user"
    And I enter password "secret_sauce"
    And I click the Login button
    Then I should be authenticated
    And I should be redirected to the inventory page

  Scenario: [SL-02] Login attempt with locked-out user
    Given I am on the Sauce Demo login page
    When I enter username "locked_out_user"
    And I enter password "secret_sauce"
    And I click the Login button
    Then I should remain on the login page
    And I should see the error message "Epic sadface: Sorry, this user has been locked out."

  Scenario: [SL-03] Sort products by price ascending
    Given I am authenticated as "standard_user"
    And I am viewing the product catalog
    When I sort the products by "Price (low to high)"
    Then the first product should be "Sauce Labs Onesie"
    And the price should be "$7.99"

  Scenario: [SL-04] Complete end-to-end checkout flow
    Given I am authenticated as "standard_user"
    And I am viewing the product catalog
    When I add "Sauce Labs Backpack" to the cart
    And I add "Sauce Labs Bike Light" to the cart
    And I open the shopping cart
    And I proceed to checkout
    And I enter the following information:
      | field      | value  |
      | first name | John   |
      | last name  | Doe    |
      | zip code   | 12345  |
    And I complete the purchase
    Then I should see the confirmation message "Thank you for your order!"
    And I should be on the order complete page
