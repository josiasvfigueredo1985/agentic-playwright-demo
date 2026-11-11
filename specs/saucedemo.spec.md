# Sauce Demo Functional Specification

Target: [Sauce Demo](https://saucedemo.com)

## Scenario 1: Valid login

**Given** the user is on the Sauce Demo login page  
**When** the user enters `standard_user` and `secret_sauce` and submits the login form  
**Then** the user is authenticated  
**And** the browser navigates to `/inventory.html`

## Scenario 2: Locked-out user

**Given** the user is on the Sauce Demo login page  
**When** the user enters `locked_out_user` and `secret_sauce` and submits the login form  
**Then** the user remains on the login page  
**And** the page displays `Epic sadface: Sorry, this user has been locked out.`

## Scenario 3: Catalog sorting

**Given** `standard_user` is authenticated and the product catalog is displayed  
**When** the user sorts products by "Price (low to high)"  
**Then** the first product is "Sauce Labs Onesie"  
**And** its price is `$7.99`

## Scenario 4: Complete checkout

**Given** `standard_user` is authenticated and the product catalog is displayed  
**When** the user adds "Sauce Labs Backpack" to the cart  
**And** opens the cart and starts checkout  
**And** enters a first name, last name, and ZIP code  
**And** reviews the order and completes the purchase  
**Then** the page displays "Thank you for your order!"
