# Windows Task Scheduler Setup Script for BidKE Auction Finalizer
# Run this script as Administrator to automatically create the scheduled task

$TaskName = "BidKE-Auction-Finalizer"
$ScriptPath = "C:\Users\ROOT\Desktop\Warp\BidKE\tools\auction_finalize_cron.bat"
$LogPath = "C:\Users\ROOT\Desktop\Warp\BidKE\api\logs\task_scheduler_setup.log"

Write-Host "Setting up BidKE Auction Finalizer Task..." -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if the batch file exists
if (-not (Test-Path $ScriptPath)) {
    Write-Host "ERROR: Batch file not found at: $ScriptPath" -ForegroundColor Red
    Write-Host "Please ensure the BidKE project is in the correct location." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    # Delete existing task if it exists
    $ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($ExistingTask) {
        Write-Host "Removing existing task..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }

    # Create the scheduled task action
    $Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$ScriptPath`""

    # Create the trigger (every 2 minutes)
    $Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 2) -RepetitionDuration (New-TimeSpan -Days 365)

    # Create task settings
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable:$false

    # Create the principal (run as SYSTEM for reliability)
    $Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

    # Register the scheduled task
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "Automatically finalizes expired BidKE auctions every 2 minutes"

    Write-Host "✅ SUCCESS: Task '$TaskName' created successfully!" -ForegroundColor Green
    Write-Host "📅 Schedule: Every 2 minutes" -ForegroundColor Cyan
    Write-Host "📂 Script: $ScriptPath" -ForegroundColor Cyan
    Write-Host "📊 Logs: C:\Users\ROOT\Desktop\Warp\BidKE\api\logs\finalize_cron.log" -ForegroundColor Cyan

    # Log the setup
    $SetupLog = "$(Get-Date): Task Scheduler setup completed successfully`n"
    Add-Content -Path $LogPath -Value $SetupLog

    # Test the task
    Write-Host "`n🧪 Testing the task..." -ForegroundColor Yellow
    Start-ScheduledTask -TaskName $TaskName
    Start-Sleep -Seconds 3

    Write-Host "✅ Task test completed. Check the logs for execution details." -ForegroundColor Green
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Monitor: C:\Users\ROOT\Desktop\Warp\BidKE\tools\auction_monitor.php" -ForegroundColor White
    Write-Host "2. View logs: C:\Users\ROOT\Desktop\Warp\BidKE\api\logs\finalize_cron.log" -ForegroundColor White
    Write-Host "3. Task Scheduler: taskschd.msc (to view/modify the task)" -ForegroundColor White

}
catch {
    Write-Host "❌ ERROR: Failed to create scheduled task!" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    
    # Log the error
    $ErrorLog = "$(Get-Date): Task Scheduler setup failed: $($_.Exception.Message)`n"
    Add-Content -Path $LogPath -Value $ErrorLog
    
    Write-Host "`n📝 Manual Setup Instructions:" -ForegroundColor Yellow
    Write-Host "1. Open Task Scheduler (taskschd.msc)" -ForegroundColor White
    Write-Host "2. Click 'Create Basic Task..'" -ForegroundColor White
    Write-Host "3. Name: BidKE-Auction-Finalizer" -ForegroundColor White
    Write-Host "4. Trigger: Daily, repeat every 2 minutes" -ForegroundColor White
    Write-Host "5. Action: Start program: $ScriptPath" -ForegroundColor White
}

Write-Host "`n🔍 Verifying Task Status..." -ForegroundColor Yellow
$CreatedTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($CreatedTask) {
    Write-Host "Task Status: $($CreatedTask.State)" -ForegroundColor Green
    Write-Host "Next Run Time: $($CreatedTask.TaskPath)" -ForegroundColor Green
}
else {
    Write-Host "Task verification failed - please set up manually" -ForegroundColor Red
}

Read-Host "`nPress Enter to exit"