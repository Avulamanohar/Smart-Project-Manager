@echo off
REM Start Smart Project Manager on Windows

setlocal enabledelayedexpansion

echo.
echo 🚀 Starting Smart Project Manager...
echo.

REM Start Backend Server
echo 📦 Starting Backend Server (Port 5005)...
start "Backend" cmd /k "cd /d backend && set PORT=5005 && npm start"

REM Start AI Service (Python)
echo 🧠 Starting AI Service (Port 5001)...
start "AI Service" cmd /k "cd /d ai-service && python app.py"

REM Start Frontend
echo 🎨 Starting Frontend (Port 5173)...
start "Frontend" cmd /k "cd /d frontend && npm run dev"

echo.
echo ✅ All services are starting. Check the new windows for each service.
echo.
echo Press Ctrl+C in each window to stop that service.
echo.
pause
