@echo off
echo ===================================================
echo   Smart Project Manager - Dependency Installer
echo ===================================================
echo.

echo [1/3] Installing AI Service Dependencies (Python)...
cd ai-service
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Error installing Python dependencies.
    pause
    exit /b %ERRORLEVEL%
)
cd ..
echo AI Service dependencies installed.
echo.

echo [2/3] Installing Backend Dependencies (Node.js)...
echo Note: This creates the "node_modules" folder for the backend.
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing Backend dependencies.
    pause
    exit /b %ERRORLEVEL%
)
cd ..
echo Backend dependencies installed.
echo.

echo [3/3] Installing Frontend Dependencies (Node.js)...
echo Note: This creates the separate "node_modules" folder for the frontend.
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing Frontend dependencies.
    pause
    exit /b %ERRORLEVEL%
)
cd ..
echo Frontend dependencies installed.
echo.

echo ===================================================
echo   All dependencies installed successfully!
echo   You are ready to run the project.
echo ===================================================
pause
