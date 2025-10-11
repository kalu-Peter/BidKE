@echo off
REM Auction Auto-Finalizer Windows Batch Script
REM This script should be scheduled to run every minute using Windows Task Scheduler
REM to ensure auctions are closed promptly when they end

REM Change to the API auctions directory
cd /d "%~dp0..\api\auctions"

REM Run the finalize script and log output
php finalize.php >> ..\logs\finalize_cron.log 2>&1

REM Log the execution with timestamp
echo %date% %time%: Auction finalization scheduled task executed >> ..\logs\finalize_cron.log