# RSVP Sheet Columns (backend-data.csv)

This document describes the column structure for the RSVP data sheet that contains confirmed trip registrations.

## Key Columns

### Identification Columns

- **"Please write your name exactly as it appears on the ID you'll be traveling with."** - Participant name
- **"If traveling with plus one - Please write the name exactly as it appears on the ID of your plus one."** - Plus one name (if applicable)
- **"Email (for all trip-related updates and communications)"** - Email address (lookup key)
- **"PASSWORD"** - Unique password for each traveler (distributed via email for security)
- **"PACK PRICE"** - Total price for selected flights and accommodations (numeric value without currency symbol)

### Pricing Columns

- **"PRIVATE ROOM UPGRADE"** - Private room upgrade price for this customer (numeric value in USD, only relevant for solo travelers)

### Boolean Itinerary Columns (1 = included, 0/empty = not included)

#### Accommodations

- **"22 NOV"** - Buenos Aires accommodation night
- **"23 NOV"** - Buenos Aires accommodation night
- **"24 NOV"** - Bariloche accommodation night
- **"25 NOV"** - Bariloche accommodation night
- **"26 NOV"** - Bariloche accommodation night
- **"27 NOV"** - Mendoza accommodation night
- **"28 NOV"** - Mendoza accommodation night
- **"29 NOV"** - Buenos Aires accommodation night

#### Flights

- **"JA3045 AEP - BRC"** - Flight from Buenos Aires (Aeroparque) to Bariloche
- **"JA3725 BRC MDZ"** - Flight from Bariloche to Mendoza
- **"JA3073 MDZ AEP"** - Flight from Mendoza to Buenos Aires (Aeroparque)

## Data Processing Notes

### Authentication

- **Email Lookup**: "Email (for all trip-related updates and communications)"

  - Case-insensitive matching
  - Trim whitespace before comparison

- **Password Verification**: "PASSWORD" column

  - Must match exactly (case-sensitive)
  - No additional processing required

### Price Processing

- **Pack Price**: "PACK PRICE"

  - Remove any currency symbols ($, USD, etc.)
  - Convert to numeric value
  - Use as base trip cost

- **Private Room Upgrade**: "PRIVATE ROOM UPGRADE"

  - Use directly as numeric value
  - Only applies to solo travelers
  - Set to 0 if not applicable

### Itinerary Processing

- **Boolean Fields**: All accommodation and flight columns

  - 1 or TRUE = included in package
  - 0, FALSE, or empty = not included (excluded service)
  - Used to generate personalized itinerary

## Example Row Structure

```
| Name         | Plus One | Email            | Password | Pack Price | Private Room | 22 NOV | 23 NOV | ... |
|-------------|----------|------------------|----------|------------|-------------|--------|--------|-----|
| John Smith  |          | john@email.com   | xyz123   | 2250       | 350         | 1      | 1      | ... |
```

## Frontend Display Logic

### Enabled Services (Green/Colorful)

- All columns with value `1` or `true`
- Show as confirmed and included

### Disabled Services (Grayed Out)

- All columns with value `0`, `false`, or empty
- Show as not included in their package

### Pricing Display

- Pack price is calculated in the backend based on selected services
- Individual service prices are not displayed to avoid revealing profit margins
- Pack price is shown as total after service confirmation list

### Contact Cases

- Email not found → "Email not found in database"
- For any changes to confirmed services → "Contact Maddie on WhatsApp"
