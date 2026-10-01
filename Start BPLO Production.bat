@echo off
title BPLO Queuing System Server (PRODUCTION PM2)
echo ===================================================
echo   Starting BPLO Queuing System in Production Mode
echo ===================================================
echo.
echo Please wait while PM2 boots up the system...
echo.

:: Navigate to the directory where this script is located
cd /d "%~dp0"

:: Start the background services via PM2
call npx pm2 start ecosystem.config.js
call npx pm2 save

echo System is running reliably in the background via PM2!
echo PM2 will automatically restart services if they crash.
echo.
echo Opening your browser to the Dashboard in 3 seconds...
timeout /t 3 /nobreak >nul

:: Open the default browser to the local IP address
start http://localhost:3000

echo.
echo You can now safely close this window. 
echo PM2 is running in the background.
echo (To view logs, type 'npx pm2 logs' in a terminal)
timeout /t 10 >nul
exit
