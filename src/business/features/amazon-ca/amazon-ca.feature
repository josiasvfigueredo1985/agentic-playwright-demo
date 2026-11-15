Feature: Amazon Canada shopping cart

    Scenario: [AM-01] Search for a notebook and add it to the cart
        Given I open the Amazon CA home page
        When I search for "notebook"
        And I add an available search result to the cart
        Then the cart should contain the selected product

    Scenario: [AM-02] Change language to French in Canadian Amazon
        Given I open the Amazon Canada home page
        When I change the language to "French"
        Then the website should display content in French
        When I search for "notebook"
        And I add an available search result to the cart
        Then the cart should contain the selected product