Feature: Domino's Brasil - Order a pizza

    Scenario: Add location, search for a pizza and add it to the cart
        Given I open the Domino's Brasil home page
        And I accept the cookies
        And I select my location
        When I set my delivery location with the following address:
            | cep       | number |
            | 30130-003 | 123    |
        And I confirm my delivery location
        And I search for the pizza "Calabresa"
        And I add the pizza "Calabresa" to the cart
        Then the cart should contain the pizza "Calabresa"
