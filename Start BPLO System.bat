@echo off
title BPLO Queuing System Server
echo ===================================================
echo   Starting BPLO Queuing System (LAN Server)
echo ===================================================
echo.
echo Please wait while the system boots up...
echo.

:: Navigate to the directory where this script is located
cd /d "%~dp0"

:: Start the backend and frontend concurrently
start "BPLO Server Background" cmd /c "npm run dev"

echo System is starting in the background!
echo.
echo Opening your browser to the Dashboard in 5 seconds...
timeout /t 5 /nobreak >nul

:: Open the default browser to the local IP address
start http://localhost:3000

echo.
echo You can now close this black window. 
echo The system is running in the background.
timeout /t 5 >nul
exit
