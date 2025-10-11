# BidKE API Cleanup Recommendations

## Summary

After analyzing all PHP files in the project, I found numerous unused API files that can be safely removed to clean up the codebase.

## Files that are DEFINITELY UNUSED and safe to remove:

### 1. Test Files in `/api/` directory:

```
api/test_admin_notifications.php
api/test_complete_workflow.php
api/test_notifications.php
api/test_payout_integration.php
api/test_payout_methods.php
```

### 2. Debug/Setup Files in `/api/` directory:

```
api/check_images.php
api/setup_notifications.php
```

### 3. Potentially unused (verify before removal):

```
api/list-auctions.php  (no frontend usage found, might be legacy)
```

### 4. Root level test files:

```
test_revenue_calculation.php
test_overview_revenue.php
test_direct_insert.php
test_api_issues.php
forgot-password.php  (duplicate - already exists in api/)
reset-password.php   (duplicate - already exists in api/)
```

### 5. Entire `/tools/` directory:

The tools directory contains 60+ PHP files that are all development/testing scripts:

- Various test\_\*.php files (test_cars_api.php, test_basic.php, etc.)
- Debug scripts (debug*payments.php, check*\*.php files)
- Development utilities

**Recommendation**: The entire `/tools/` directory can be archived or removed as it contains only development/testing scripts.

## Files that are USED and should be kept:

### Active API Endpoints:

- `api/auction-details.php` ✓
- `api/auctions.php` ✓
- `api/bids.php` ✓
- `api/messages.php` ✓
- `api/notifications.php` ✓
- `api/place-bid.php` ✓
- `api/payout-methods.php` ✓
- `api/seller_sales.php` ✓
- `api/upload.php` ✓
- `api/watchlist.php` ✓
- `api/withdraw-bid.php` ✓
- `api/won-auctions.php` ✓
- All files in `api/auth/` directory ✓
- All files in `api/auctions/` directory ✓
- All files in `api/admin/` directory ✓
- All files in `api/payments/` directory ✓

## Cleanup Commands:

```bash
# Remove unused test files from api directory
rm api/test_admin_notifications.php
rm api/test_complete_workflow.php
rm api/test_notifications.php
rm api/test_payout_integration.php
rm api/test_payout_methods.php

# Remove debug/setup files
rm api/check_images.php
rm api/setup_notifications.php

# Remove root level test files
rm test_revenue_calculation.php
rm test_overview_revenue.php
rm test_direct_insert.php
rm test_api_issues.php

# Archive or remove entire tools directory (backup first!)
# mv tools tools_backup
# rm -rf tools

# Check and remove duplicate files (if confirmed they're duplicates)
# rm forgot-password.php  # (exists in api/)
# rm reset-password.php   # (exists in api/)
```

## Disk Space Savings:

Removing these files will:

- Clean up the codebase
- Reduce confusion about which files are active
- Save disk space (estimated 1-2MB)
- Improve maintenance efficiency

## Recommendation:

1. **Immediate**: Remove the clearly unused test files from the `/api/` directory
2. **After backup**: Archive the entire `/tools/` directory
3. **Verify**: Check `api/list-auctions.php` - if truly unused, remove it
4. **Clean root**: Remove duplicate/test files from project root
