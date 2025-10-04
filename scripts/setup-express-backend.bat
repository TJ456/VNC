@echo off
REM Express Backend Setup Script for Windows

echo 🚀 Setting up VNC Protection Platform Express Backend...
echo ====================================================

cd backend-express

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ npm detected

REM Install dependencies
echo 📦 Installing Node.js dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npm run prisma:generate

if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo ✅ Prisma client generated

REM Run database migrations
echo 📊 Running database setup...
echo ⚠️  Please ensure PostgreSQL is running and configured

npm run prisma:push

if %errorlevel% equ 0 (
    echo ✅ Database schema created successfully
    
    REM Seed database
    echo 🌱 Seeding database...
    npm run prisma:seed
    
    if %errorlevel% equ 0 (
        echo ✅ Database seeded successfully
    ) else (
        echo ⚠️  Database seeding failed, but you can continue
    )
) else (
    echo ⚠️  Database setup failed. Please check your PostgreSQL configuration.
    echo    You can retry with: npm run prisma:push
)

echo.
echo 🎉 Express Backend Setup Complete!
echo ==================================
echo.
echo To start the backend server:
echo   cd backend-express
echo   npm start
echo.
echo For development with auto-reload:
echo   npm run dev
echo.
echo Backend will be available at: http://localhost:8000
echo API Health Check: http://localhost:8000/api/health
echo.
echo 📝 Configuration file: backend-express\.env
echo 📊 Database management: npm run prisma:studio
echo.

pause