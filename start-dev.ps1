# PowerShell Development Server Startup Script for BidKE
# Run this script to start both frontend and backend servers

Write-Host "🚀 Starting BidKE Development Environment..." -ForegroundColor Green
Write-Host ""

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient("localhost", $Port)
        $connection.Close()
        Write-Host "⚠️  Port $Port is already in use" -ForegroundColor Yellow
        return $false
    }
    catch {
        Write-Host "✅ Port $Port is available" -ForegroundColor Green
        return $true
    }
}

# Check required ports
Write-Host "📡 Checking ports..." -ForegroundColor Blue
Test-Port -Port 8000  | Out-Null # PHP API server
Test-Port -Port 8082  | Out-Null # Vite dev server

Write-Host ""
Write-Host "🔧 Environment Configuration:" -ForegroundColor Cyan
Write-Host "   • Frontend: http://localhost:8082"
Write-Host "   • API Server: http://localhost:8000" 
Write-Host "   • Database: localhost:5054"
Write-Host ""

# Start PHP development server
Write-Host "🐘 Starting PHP API server on port 8000..." -ForegroundColor Magenta
$phpJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\ROOT\Desktop\Warp\BidKE\api"
    php -S localhost:8000
}

# Wait a moment for PHP server to start
Start-Sleep 3

# Check if PHP server started successfully
if ($phpJob.State -eq "Running") {
    Write-Host "✅ PHP server started successfully" -ForegroundColor Green
}
else {
    Write-Host "❌ Failed to start PHP server" -ForegroundColor Red
    Stop-Job $phpJob
    Remove-Job $phpJob
    exit 1
}

Write-Host ""
Write-Host "⚛️  Starting Vite development server..." -ForegroundColor Blue

# Start Vite development server
try {
    npm run dev
}
catch {
    Write-Host "❌ Failed to start Vite server" -ForegroundColor Red
}
finally {
    # Cleanup PHP server when Vite stops
    Write-Host ""
    Write-Host "🛑 Stopping PHP server..." -ForegroundColor Yellow
    Stop-Job $phpJob -PassThru | Remove-Job
    Write-Host "✅ All servers stopped" -ForegroundColor Green
}