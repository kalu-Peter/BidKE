#!/bin/bash
# Auction Auto-Finalizer Cron Script
# This script should be run every minute to ensure auctions are closed promptly when they end
# Add to crontab with: * * * * * /path/to/auction_finalize_cron.sh

# Change to the API directory
cd "$(dirname "$0")/api/auctions"

# Run the finalize script
php finalize.php >> ../logs/finalize_cron.log 2>&1

# Log the execution
echo "$(date): Auction finalization cron executed" >> ../logs/finalize_cron.log