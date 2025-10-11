# API Usage Analysis for BidKE

## Used API Endpoints (Found in Frontend Code):

### Authentication & User Management:

- `/auth/register.php` - User registration
- `/auth/login.php` - User login
- `/auth/logout.php` - User logout
- `/auth/verify.php` - Email verification
- `/auth/profile.php` - User profile management
- `/auth/buyer-profile.php` - Buyer profile management
- `/auth/seller-profile.php` - Seller profile management
- `/auth/seller-verify.php` - Seller verification
- `/auth/admin-signup.php` - Admin registration

### Auctions:

- `/auctions.php` - Main auctions listing
- `/auction-details.php` - Auction details
- `/auctions/create.php` - Create auction
- `/auctions/update.php` - Update auction
- `/auctions/seller-auctions.php` - Seller's auctions
- `/auctions/categories.php` - Auction categories

### Bidding & Sales:

- `/place-bid.php` - Place a bid
- `/bids.php` - Get user bids
- `/won-auctions.php` - Get won auctions
- `/seller_sales.php` - Seller sales data
- `/withdraw-bid.php` - Withdraw bid (if used)

### Payments:

- `/payments/process.php` - Process payments
- `/payments/process_auction.php` - Process auction payments
- `/payments/dev_confirm.php` - Dev payment confirmation
- `/payments/admin/confirm.php` - Admin payment confirmation

### Watchlist & Notifications:

- `/watchlist.php` - Watchlist management
- `/notifications.php` - Notifications system
- `/messages.php` - Messaging system

### Admin:

- `/admin/overview.php` - Admin dashboard overview
- `/admin/listings.php` - Admin listings management
- `/admin/won_auctions.php` - Admin won auctions
- `/admin/seller-verifications.php` - Seller verification management
- `/admin/user-verification.php` - User verification
- `/admin/user-verification-management.php` - User verification management
- `/admin/suspend-user.php` - User suspension

### Payout System:

- `/payout-methods.php` - Payout methods management

### File Upload:

- `/upload.php` - File upload (via form data)

## Definitely UNUSED API Files (Safe to Remove):

### Test Files:

- `test_admin_notifications.php` - Test script, not used in production
- `test_complete_workflow.php` - Test script, not used in production
- `test_notifications.php` - Test script, not used in production
- `test_payout_integration.php` - Test script, not used in production
- `test_payout_methods.php` - Test script, not used in production

### Development/Debug Files:

- `check_images.php` - Debug script, not used in frontend
- `setup_notifications.php` - Setup script, not used in frontend

### Potentially Unused but Check Dependencies:

- `list-auctions.php` - Not found in frontend code, might be legacy

### Used Files (Keep These):

- `forgot-password.php` - Used in ForgotPassword.tsx
- `reset-password.php` - Used in ResetPassword.tsx
- `withdraw-bid.php` - Used in MyBidsTab.tsx

## Directory Analysis:

### Root API files that are UNUSED:

1. **check_images.php** - Debug tool
2. **setup_notifications.php** - Setup script
3. **test_admin_notifications.php** - Test file
4. **test_complete_workflow.php** - Test file
5. **test_notifications.php** - Test file
6. **test_payout_integration.php** - Test file
7. **test_payout_methods.php** - Test file
8. **list-auctions.php** - Legacy file (no frontend usage found)

### Entire directories that might be unused:

- **`/tools/`** - Contains numerous PHP debug/test scripts (324 PHP files total!)
- **`/api/cron/`** - May contain cron job scripts
- **Root level test files** - Various test\_\*.php files in project root

## Files that could be safely removed:

```
api/check_images.php
api/setup_notifications.php
api/test_admin_notifications.php
api/test_complete_workflow.php
api/test_notifications.php
api/test_payout_integration.php
api/test_payout_methods.php
api/list-auctions.php (verify first)
```

## Entire directories to consider for cleanup:

```
tools/  (massive directory with test scripts)
Root level test_*.php files
```
