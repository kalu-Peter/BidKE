# Watchlist toggle end-to-end test
try {
    $payloadObj = @{ user_id = 1; auction_id = 1; toggle = $true }
    $payload = $payloadObj | ConvertTo-Json

    $before = Invoke-WebRequest -Uri 'http://localhost:8000/watchlist.php?user_id=1' -UseBasicParsing -Method GET
    Write-Output "BEFORE:`n$($before.Content)`n"

    $add = Invoke-WebRequest -Uri 'http://localhost:8000/watchlist.php' -UseBasicParsing -Method POST -Body $payload -ContentType 'application/json'
    Write-Output "ADD RESPONSE:`n$($add.Content)`n"

    Start-Sleep -Milliseconds 200

    $rem = Invoke-WebRequest -Uri 'http://localhost:8000/watchlist.php' -UseBasicParsing -Method POST -Body $payload -ContentType 'application/json'
    Write-Output "REMOVE RESPONSE:`n$($rem.Content)`n"

    Start-Sleep -Milliseconds 200

    $after = Invoke-WebRequest -Uri 'http://localhost:8000/watchlist.php?user_id=1' -UseBasicParsing -Method GET
    Write-Output "AFTER:`n$($after.Content)`n"
}
catch {
    Write-Error "Error during test: $_"
    exit 2
}
