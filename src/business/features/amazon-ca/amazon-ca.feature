Feature: Amazon Canada shopping cart

    Scenario: [AM-01] Search for a notebook and add it to the cart
        Given I open the Amazon CA home page
        When I search for "notebook"
        And I add an available search result to the cart
        Then the cart should contain the selected product

    Scenario: [AM-02] Change language to French in Canadian Amazon and search for <item>
        Given I open the Amazon Canada home page
        When I change the language to "French"
        Then the website should display content in French
        When I search for "<item>"
        And I add an available search result to the cart
        Then the cart should contain the selected product
        Examples:
            | item       |
            | notebook   |
            | laptop     |
            | smartphone |

# Skip
# Scenario: [AM-03] Display product prices in French Canadian format
#     Given I open the Amazon Canada home page
#     When I change the language to "French"
#     And I search for "notebook"
#     Then a product price should show two decimal places separated by a comma and the "$" symbol after the amount
#     When I add that product to the cart
#     Then its price in the cart should show two decimal places separated by a comma and the "$" symbol after the amount