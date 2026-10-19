#!/bin/bash

# MediSync Quick Start Script
# This script helps you start both backend and frontend servers

echo "🏥 MediSync - Quick Start"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Copy backend/.env.example to backend/.env and fill in your credentials."
    echo "See README.md for details."
    echo ""
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Node.js
if ! command_exists node; then
    echo "❌ Error: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
    echo ""
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    echo ""
fi

# Ask if user wants to seed data
echo "🌱 Do you want to seed sample data? (recommended for first time)"
echo "   This will create sample doctors, patients, and appointments."
read -p "   Seed data? (y/n): " seed_choice
echo ""

if [ "$seed_choice" = "y" ] || [ "$seed_choice" = "Y" ]; then
    echo "🌱 Seeding database..."
    npm run seed
    echo ""
fi

echo "🚀 Starting servers..."
echo ""
echo "📍 Backend will run on: http://localhost:5000"
echo "📍 Frontend will run on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""
echo "=============================="
echo ""

# Start backend in background
echo "Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend server..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Wait for both processes
wait
