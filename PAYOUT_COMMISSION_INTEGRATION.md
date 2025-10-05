# Combined Payout and Commission Processing

This document describes the enhanced payout processing functionality that simultaneously handles payout completion and commission processing.

## Overview

The submit payout button now triggers both:

1. **Payout Status Update**: Updates the payout from 'pending' to 'completed'
2. **Commission Processing**: Creates or updates commission records automatically

## API Endpoint

**Endpoint**: `/api/payments/admin/process_payout_and_commission.php`  
**Method**: POST  
**Content-Type**: application/json

### Request Body

```json
{
  "payout_id": 123
}
```

### Success Response

```json
{
  "success": true,
  "message": "Payout and commission processed successfully",
  "payout_id": 123,
  "commission_id": 456,
  "payout_amount": "90.00",
  "platform_fee": "10.00",
  "previous_status": "pending",
  "new_status": "completed"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description"
}
```

## Database Operations

The endpoint performs the following operations atomically:

1. **Validates** the payout exists and is in 'pending' status
2. **Updates** the payout status to 'completed'
3. **Checks** for existing commission records for the same payment/auction/seller
4. **Creates** new commission record OR **updates** existing commission to 'completed'
5. **Commits** all changes as a single transaction

## Frontend Integration

### TransactionsTab Component

The `handleSubmitPayout` function now:

- Calls the combined endpoint instead of separate payout status endpoint
- Shows enhanced success messages with payout and commission details
- Maintains the same UI loading states and error handling

### Button Text

- **Previous**: "Submit Payment"
- **Current**: "Process Payout" (reflects combined functionality)

## Commission Logic

- **Platform Fee**: Uses existing `platform_fee` from payout record, or calculates 10% of payment amount
- **Commission Percentage**: Defaults to 10.00%
- **Status**: All commissions created through this process are set to 'completed'
- **Duplicate Prevention**: Checks for existing commissions before creating new ones

## Benefits

1. **Atomic Processing**: Both payout and commission operations succeed or fail together
2. **Data Consistency**: Ensures commission records exist for all completed payouts
3. **Simplified Workflow**: Single button click handles both operations
4. **Better Revenue Tracking**: Commission records enable accurate platform revenue reporting

## Error Handling

The system includes comprehensive error handling:

- **Database Validation**: Ensures payout exists and is processable
- **Transaction Rollback**: Reverts all changes if any operation fails
- **Duplicate Prevention**: Safely handles cases where commissions already exist
- **Detailed Logging**: All operations are logged for debugging and audit purposes

## Testing

Test files are available in the `tools/` directory:

- `test_combined_payout_simple.php`: Tests the processing logic
- `test_http_endpoint.php`: Tests the HTTP endpoint functionality
- `check_data.php`: Verifies database state and creates test data

## Migration Notes

- Existing payout processing functionality remains compatible
- Old endpoint (`update_payout_status.php`) still exists for backward compatibility
- Commission records may need to be backfilled for historical payouts if required
