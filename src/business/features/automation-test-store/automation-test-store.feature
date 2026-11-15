Feature: Automation Test Store shopping cart

    Scenario: [ATS-01] Search for a bronzer and add it to the cart
        Given I open the Automation Test Store home page
        When I search for "bronzer"
        And I open "Skinsheen Bronzer Stick"
        And I add it to the cart
        Then the cart should contain "Skinsheen Bronzer Stick"

    Scenario Outline: [ATS-02] Change currency to euros and search for <item>
        Given I open the Automation Test Store home page
        When I change the currency to euros
        Then the store should display euros as the selected currency
        When I search for "<item>"
        And I open "<product>"
        And I add it to the cart
        Then the cart should contain "<product>"

        Examples:
            | item    | product                     |
            | bronzer | Skinsheen Bronzer Stick     |
            | shampoo | Curls to straight Shampoo   |
            | cream   | Total Moisture Facial Cream |

    Scenario: [ATS-03] Display product prices in euros in search results and cart
        Given I open the Automation Test Store home page
        When I change the currency to euros
        And I search for "bronzer"
        Then the price of "Skinsheen Bronzer Stick" in the search results should have two decimal places separated by a period and the euro symbol after the amount
        When I open "Skinsheen Bronzer Stick"
        And I add it to the cart
        Then its unit price in the cart should match the search result price
        And its unit price should have two decimal places separated by a period and the euro symbol after the amount

    # Scenario: [ATS-04] Remove a product from the cart
    #     Given I open the Automation Test Store home page
    #     When I search for "bronzer"
    #     And I open "Skinsheen Bronzer Stick"
    #     And I add it to the cart
    #     And I remove "Skinsheen Bronzer Stick" from the cart
    #     Then the cart should no longer contain "Skinsheen Bronzer Stick"
