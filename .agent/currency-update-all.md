# Currency Update - Albanian Lek (ALL)

## Changes Made

### 1. Currency Symbol Changed
- **From**: $ (Dollar)
- **To**: ALL (Albanian Lek)

### 2. Price Display Simplified
- **Removed**: Per-unit price display (e.g., "ALL 440.00 each")
- **Kept**: Only the subtotal for each item

## Files Modified

### `/src/components/Basket.jsx`
- ✅ Removed per-unit price display (commented out)
- ✅ Changed item subtotal from `$` to `ALL`
- ✅ Changed variant prices from `$` to `ALL`
- ✅ Changed basket subtotal from `$` to `ALL`

### `/src/pages/Checkout.jsx`
- ✅ Removed per-unit price display (commented out)
- ✅ Changed item subtotal from `$` to `ALL`
- ✅ Changed variant prices from `$` to `ALL`
- ✅ Changed order summary prices from `$` to `ALL`:
  - Subtotal
  - Delivery Fee
  - Service Fee
  - Tip
  - Total Amount

## Display Format

### Before:
```
Item Name
$440.00 each
Subtotal: $440.00
```

### After:
```
Item Name
Subtotal: ALL 440.00
```

## Examples

### Basket Item:
- **Item**: Red Velvet Cheesecake → **ALL 440.00**
- **Variant**: Extra Cream → **(+ALL 200.00)**
- **Basket Subtotal**: **ALL 790.00**

### Checkout Summary:
- **Subtotal**: ALL 440.00
- **Delivery Fee**: ALL 50.00
- **Service Fee**: ALL 10.00
- **Tip**: ALL 20.00
- **Total**: ALL 520.00

## Notes
- The per-unit price is commented out (not deleted) so it can be easily restored if needed
- All currency formatting is consistent across basket and checkout pages
- The format is `ALL {amount}` with 2 decimal places
