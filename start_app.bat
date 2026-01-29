@echo off
echo ===================================================
echo   Daily Work Log & AI Analytics System - Startup
echo ===================================================

echo.
echo [1/2] Starting Backend Server with Auto-Reload...
start "WorkLog Server" cmd /k "cd server && npm run dev"

echo.
echo [2/2] Starting Frontend Client...
start "WorkLog Client" cmd /k "cd client && npm run dev"

echo.
echo ===================================================
echo   System Started!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ===================================================
echo.
pause
