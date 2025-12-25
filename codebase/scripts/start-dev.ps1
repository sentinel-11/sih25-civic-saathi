# Development Server Startup Script
# This script starts both backend and frontend servers

Write-Host "🚀 Starting Civic Saathi Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Get the project root directory (parent of scripts folder)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

# Start backend in a new window
Write-Host "▶️  Starting Backend Server (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot'; npm run backend"

# Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# Start frontend in a new window
Write-Host "▶️  Starting Frontend Server (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot'; npm run frontend"

Write-Host ""
Write-Host "✅ Servers are starting!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
