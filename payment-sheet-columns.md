# Google Sheet Columns for Argentina Trip Form

This document describes the column structure for the Google Sheet that will store submissions from the Argentina trip configuration form.

## Sheet Structure

### Basic Information Columns

Field Name  | Data Type | Description                           | Required
----------- | --------- | ------------------------------------- | --------
`timestamp` | DateTime  | Submission timestamp (auto-generated) | Yes
`email`     | Email     | Participant's email address           | Yes
`firstName` | Text      | Participant's first name              | Yes
`lastName`  | Text      | Participant's last name               | Yes

### Trip Configuration Columns

Field Name   | Data Type | Description                   | Required
------------ | --------- | ----------------------------- | --------
`tripOption` | Number    | Selected trip option (1 or 2) | Yes

### Accommodation Columns

Field Name | Data Type | Description                                                                      | Required
---------- | --------- | -------------------------------------------------------------------------------- | -----------
`roommate` | Text      | Roommate name (only filled if shared accommodation, else we will assume private) | Conditional

### Activities Columns

Field Name        | Data Type | Description                                  | Required
----------------- | --------- | -------------------------------------------- | --------
`horsebackRiding` | Boolean   | Whether horseback riding was selected        | Yes
`cookingClass`    | Boolean   | Whether empanadas cooking class was selected | Yes
`rafting`         | Boolean   | Whether rafting adventure was selected       | Yes

### Payment Configuration Columns

Field Name        | Data Type | Description                                 | Required
----------------- | --------- | ------------------------------------------- | --------
`paymentSchedule` | Text      | Payment schedule ("full" or "installments") | Yes
`paymentMethod`   | Text      | Payment method ("credit" or "bank")         | Yes

### Pricing Columns (Calculated Values)

Field Name           | Data Type | Description                                    | Required
-------------------- | --------- | ---------------------------------------------- | --------
`basePrice`          | Number    | Base trip price (2250 or 2600 USD)             | Yes
`privateRoomUpgrade` | Number    | Additional accommodation cost (0 or 350 USD)   | Yes
`activitiesPrice`    | Number    | Total cost of selected activities              | Yes
`subtotal`           | Number    | Base + accommodation + activities              | Yes
`processingFee`      | Number    | Credit card processing fee (4% if credit card) | Yes
`total`              | Number    | Final total amount                             | Yes
`installmentAmount`  | Number    | First installment amount (35% if installments) | Yes

## Data Validation Rules

### Required Field Validation

- `email`: Must be valid email format
- `firstName`: Must not be empty
- `lastName`: Must not be empty
- `tripOption`: Must be either 1 or 2
- `paymentSchedule`: Must be either "full" or "installments"
- `paymentMethod`: Must be either "credit" or "bank"
- `horsebackRiding`: Must be boolean (TRUE/FALSE)
- `cookingClass`: Must be boolean (TRUE/FALSE)
- `rafting`: Must be boolean (TRUE/FALSE)

### Pricing Calculation Rules

- `basePrice`: Always comes from RSVP lookup data
- `privateRoomUpgrade`: Set to accommodation upgrade price or 0
- `activitiesPrice`: Sum of selected activity prices
- `subtotal`: Base + accommodation + activities
- `processingFee`: 4% of subtotal if credit card payment, otherwise 0
- `total`: Subtotal + processing fee
- `installmentAmount`: 35% of total if installment plan, otherwise equals total

### Business Rules

- All prices are in USD
- Credit card payments incur a 4% processing fee
- Bank transfers have no processing fee
- Installment plans require 35% upfront, 65% by deadline
- Activity selections are optional but recorded as boolean values
