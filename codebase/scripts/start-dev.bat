@echo off
echo Starting Civic Saathi Development Servers...
echo.

REM Change to project root (parent of scripts folder)
cd /d "%~dp0.."

echo Starting Backend Server (Port 5000)...
start "Backend - Port 5000" cmd /k "npm run backend"

timeout /t 2 /nobreak > nul

echo Starting Frontend Server (Port 5173)...
start "Frontend - Port 5173" cmd /k "npm run frontend"

echo.
echo Servers are starting!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
