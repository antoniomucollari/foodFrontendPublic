# Basket Component Update - Variants & Validation Support

## Overview
Updated the Basket component to display variant information and handle deleted/invalid items based on the new API response structure from `http://localhost:8080/api/cart/basket/{branchId}`.

## API Response Structure
```json
{
    "statusCode": 200,
    "message": "Cart retrieved successfully",
    "data": {
        "id": 20,
        "restaurantBranchId": 5,
        "restaurantBranchName": "BurgerKing",
        "items": [
            {
                "id": 85,
                "name": "Red Velvet Cheesecake",
                "quantity": 1,
                "pricePerUnit": 440.00,
                "subTotal": 440.00,
                "variants": [
                    {
                        "id": 36,
                        "name": "fdsafsdf",
                        "recommendedPrice": 400.00,
                        "isAvailable": true,
                        "deleted": false
                    }
                ],
                "validationMessages": [],
                "valid": true
            }
        ],
        "subtotal": 440.00
    }
}
```

## Changes Made

### 1. **Variant Display**
- Each cart item now displays its associated variants
- Variants show:
  - Name
  - Price (if > 0)
  - Status indicators (Deleted/Unavailable)
- Visual styling:
  - Normal variants: muted text color
  - Deleted/Unavailable variants: red text with strikethrough
  - Left border to visually group variants

### 2. **Validation Messages**
- Displays validation messages when items are invalid
- Shows in a highlighted warning box with destructive styling
- Each message is displayed as a bullet point

### 3. **Invalid Item Handling**
- Items marked as `valid: false` are visually highlighted:
  - Red/destructive background tint
  - Red border
  - Alert triangle icon next to item name
- Controls (increment/decrement) are disabled for invalid items
- Remove button remains active to allow deletion

### 4. **Cart-Level Warnings**
- When cart contains invalid items:
  - Warning banner displayed above checkout section
  - Clear message: "Some items are unavailable"
  - Instructions to remove invalid items
  - Checkout button is disabled

### 5. **Enhanced UI/UX**
- Restaurant branch name displayed at top of basket
- Each item now in a card-style layout with padding
- Better visual hierarchy:
  - Item name and price per unit
  - Subtotal for that item (quantity × price)
  - Variants grouped and indented
  - Controls at the bottom right
- Dollar signs added to all prices for clarity
- Improved spacing and typography

## Visual States

### Valid Item
```
┌─────────────────────────────────────┐
│ Item Name                   $10.00  │
│ $5.00 each                          │
│                                     │
│ │ • Variant 1 (+$2.00)             │
│ │ • Variant 2 (+$3.00)             │
│                                     │
│                    [-] 2 [+] [🗑]   │
└─────────────────────────────────────┘
```

### Invalid Item (Deleted Variant)
```
┌─────────────────────────────────────┐ (Red tinted)
│ Item Name ⚠️                 $10.00  │
│ $5.00 each                          │
│                                     │
│ │ • Variant 1 (+$2.00) (Deleted)   │ (Red, strikethrough)
│ │ • Variant 2 (+$3.00)             │
│                                     │
│ ⚠️ This item is no longer available │
│                                     │
│                    [-] 2 [+] [🗑]   │ (Disabled)
└─────────────────────────────────────┘
```

### Cart Warning
```
┌─────────────────────────────────────┐
│ ⚠️ Some items are unavailable       │
│    Please remove invalid items      │
│    before proceeding to checkout.   │
└─────────────────────────────────────┘
```

## Key Features

1. **Price Transparency**: Shows both per-unit price and subtotal
2. **Variant Tracking**: All selected variants are visible with their prices
3. **Status Awareness**: Clear indicators for deleted/unavailable variants
4. **Validation Feedback**: Backend validation messages displayed to user
5. **Checkout Protection**: Prevents checkout when cart has invalid items
6. **Accessibility**: Disabled states and visual warnings guide user actions

## Testing Scenarios

1. **Normal Cart**: Items with valid variants display correctly
2. **Deleted Variant**: Variant shows as deleted with strikethrough
3. **Unavailable Variant**: Variant shows as unavailable
4. **Invalid Item**: Item is highlighted, controls disabled, checkout blocked
5. **Mixed Cart**: Valid and invalid items can coexist, only invalid ones are highlighted

## File Modified
- `/src/components/Basket.jsx`
- `/src/pages/Checkout.jsx`

## Dependencies Added
- `AlertTriangle` icon from `lucide-react` (Basket.jsx only)

## Notes
- Both the basket and checkout pages now consistently display variant information
- Invalid items are disabled in both views to prevent quantity changes
- The checkout page also shows validation messages and deleted/unavailable variants
- Price formatting is now consistent across both components with dollar signs

