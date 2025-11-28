@echo off
REM CareConnect Quick Start Script for Windows
REM This script helps you start both backend and frontend servers

echo.
echo 🏥 CareConnect - Quick Start
echo ==============================
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  Warning: .env file not found!
    echo Please create a .env file with your database credentials.
    echo See README.md for details.
    echo.
    pause
    exit /b 1
)

REM Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing backend dependencies...
    call npm install
    echo.
)

REM Check if frontend node_modules exists
if not exist frontened\node_modules (
    echo 📦 Installing frontend dependencies...
    cd frontened
    call npm install
    cd ..
    echo.
)

REM Ask if user wants to seed data
echo 🌱 Do you want to seed sample data? (recommended for first time)
echo    This will create sample doctors, patients, and appointments.
set /p seed_choice="   Seed data? (y/n): "
echo.

if /i "%seed_choice%"=="y" (
    echo 🌱 Seeding database...
    call npm run seed
    echo.
)

echo 🚀 Starting servers...
echo.
echo 📍 Backend will run on: http://localhost:5000
echo 📍 Frontend will run on: http://localhost:5173
echo.
echo Press Ctrl+C to stop all servers
echo.
echo ==============================
echo.

REM Start backend
echo Starting backend server...
start "CareConnect Backend" cmd /k "npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo Starting frontend server...
cd frontened
start "CareConnect Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ✅ Servers started in separate windows!
echo    Close those windows or press Ctrl+C to stop them.
echo.
pause
