@echo off
echo ============================================
echo       HimBus - Bus Booking Application
echo ============================================
echo.
echo Starting Backend API (port 5000)...
start "HimBus Backend" cmd /k "cd /d %~dp0backend && node server.js"
echo.
echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul
echo.
echo Starting Frontend Dev Server (port 5173)...
start "HimBus Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo ============================================
echo   App is starting! Open your browser at:
echo   http://localhost:5173
echo ============================================
timeout /t 4 /nobreak > nul
start http://localhost:5173
