# Start DoltgreSQL and Next.js admin portal together
# Usage: .\start-dev.ps1

$root = $PSScriptRoot

# Start DoltgreSQL in background
$dolt = Start-Process doltgres -WorkingDirectory "$root\lwf-staging" -PassThru
Write-Host "DoltgreSQL started (PID $($dolt.Id)) on port 5433"

# Give Dolt a moment to bind the port
Start-Sleep -Seconds 2

# Start Next.js dev server in foreground
Write-Host "Starting admin portal on http://localhost:3000 ..."
Set-Location "$root\admin"
try {
    npm run dev
} finally {
    # When you Ctrl+C the dev server, also stop DoltgreSQL
    Write-Host "Stopping DoltgreSQL..."
    Stop-Process -Id $dolt.Id -ErrorAction SilentlyContinue
}
