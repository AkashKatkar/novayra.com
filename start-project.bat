@echo off
echo ========================================
echo    Novayra E-commerce Project Starter
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

echo Checking if .env file exists...
if not exist "backend\.env" (
    echo ⚠️  .env file not found in backend folder
    echo Creating from template...
    if exist "backend\env.example" (
        copy "backend\env.example" "backend\.env"
        echo ✅ .env file created
    ) else (
        echo ❌ env.example not found
        echo Please create backend\.env manually
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file exists
)

echo.
echo Checking if node_modules exists...
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

echo.
echo ✅ Database test removed - use database/schema.sql for setup

echo.
echo 🚀 Starting Novayra E-commerce Server...
echo.
echo 📍 Server will be available at: http://localhost:3000
echo 🌐 Frontend: http://localhost:3000
echo 🔌 API: http://localhost:3000/api
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause 