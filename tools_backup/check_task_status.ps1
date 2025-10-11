# BidKE Task Scheduler Monitor Script
# Run this to check if the auction finalizer task is working properly

Write-Host "🔍 BidKE Auction Finalizer Task Status Check" -ForegroundColor Cyan
Write-Host "=" * 50

# Check if task exists and its status
$TaskName = "*BidKE*"
$Tasks = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($Tasks) {
    foreach ($Task in $Tasks) {
        Write-Host "✅ Task Found: $($Task.TaskName)" -ForegroundColor Green
        Write-Host "   Status: $($Task.State)" -ForegroundColor Yellow
        Write-Host "   Path: $($Task.TaskPath)" -ForegroundColor Gray
        
        # Get task info
        $TaskInfo = Get-ScheduledTaskInfo -TaskName $Task.TaskName -ErrorAction SilentlyContinue
        if ($TaskInfo) {
            Write-Host "   Last Run: $($TaskInfo.LastRunTime)" -ForegroundColor Gray
            Write-Host "   Last Result: $($TaskInfo.LastTaskResult)" -ForegroundColor Gray
            Write-Host "   Next Run: $($TaskInfo.NextRunTime)" -ForegroundColor Gray
        }
    }
}
else {
    Write-Host "❌ No BidKE task found!" -ForegroundColor Red
    Write-Host "Please set up the task manually or run setup_task_scheduler.ps1" -ForegroundColor Yellow
}

Write-Host "`n📊 Recent Log Entries:" -ForegroundColor Cyan
$LogPath = "C:\Users\ROOT\Desktop\Warp\BidKE\api\logs\finalize_cron.log"
if (Test-Path $LogPath) {
    Write-Host "✅ Log file exists" -ForegroundColor Green
    $LogEntries = Get-Content $LogPath | Select-Object -Last 5
    foreach ($Entry in $LogEntries) {
        Write-Host "   $Entry" -ForegroundColor Gray
    }
}
else {
    Write-Host "❌ Log file not found at: $LogPath" -ForegroundColor Red
}

Write-Host "`n🌐 Monitoring Dashboard:" -ForegroundColor Cyan
Write-Host "   http://localhost:8000/tools/auction_monitor.php" -ForegroundColor Blue

Write-Host "`n📋 Task Scheduler Management:" -ForegroundColor Cyan
Write-Host "   Run 'taskschd.msc' to view/edit tasks" -ForegroundColor Blue

Write-Host "`n✅ Monitoring Complete!" -ForegroundColor Green