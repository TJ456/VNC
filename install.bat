@echo off
REM VNC Protection Platform Installation Script for Windows

echo ======================================
echo VNC Protection Platform Setup
echo ======================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH. Please install Python 3.8 or later.
    pause
    exit /b 1
)

echo ✅ Python detected

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ to run the dashboard.
    echo    The backend will work without Node.js, but you won't have the web interface.
    set /p continue="Continue without dashboard? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
    set SKIP_FRONTEND=true
) else (
    echo ✅ Node.js detected
)

REM Create virtual environment
echo 📦 Creating Python virtual environment...
python -m venv venv

REM Activate virtual environment
echo 📦 Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo 📦 Upgrading pip...
python -m pip install --upgrade pip

REM Install Python dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

REM Create necessary directories
echo 📁 Creating directories...
if not exist logs mkdir logs
if not exist detection\models mkdir detection\models
if not exist configs mkdir configs

REM Copy example configuration
if not exist configs\.env (
    echo ⚙️  Creating configuration file...
    copy configs\.env.example configs\.env
    echo 📝 Please edit configs\.env to customize your settings
)

REM Initialize database
echo 🗄️  Initializing database...
python database\setup.py

REM Install frontend dependencies (if Node.js is available)
if not "%SKIP_FRONTEND%"=="true" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

echo.
echo ======================================
echo 🎉 Installation Complete!
echo ======================================
echo.
echo To start the VNC Protection Platform:
echo.
echo 1. Backend only:
echo    python main.py --mode backend
echo.
if not "%SKIP_FRONTEND%"=="true" (
    echo 2. Full platform ^(backend + frontend^):
    echo    REM Terminal 1:
    echo    python main.py --mode backend
    echo    REM Terminal 2:
    echo    cd frontend ^&^& npm start
    echo.
)
echo 3. Run demo:
echo    python main.py --mode demo
echo.
echo 📊 Dashboard will be available at: http://localhost:3000
echo 🔌 API will be available at: http://localhost:8000
echo.
echo 📝 Configuration file: configs\.env
echo 📋 Logs directory: logs\
echo.
echo ⚠️  Important Security Notes:
echo - Change default passwords and keys in configs\.env
echo - Ensure proper firewall configuration
echo - Review VNC server settings for security
echo.

pause