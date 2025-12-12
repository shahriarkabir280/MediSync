#!/bin/bash

# Modern Chat System - Quick Start Script

echo "🚀 Setting up Modern Chat System..."
echo ""

# Navigate to backend
cd "$(dirname "$0")/backened"

echo "📦 Step 1: Installing backend dependencies..."
npm install socket.io
echo "✅ Backend dependencies installed"
echo ""

echo "🗄️  Step 2: Creating database schema..."
node schemas/chatSchema.js
echo "✅ Database schema created"
echo ""

# Navigate to frontend
cd ../frontened

echo "📦 Step 3: Checking frontend dependencies..."
npm list socket.io-client > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ socket.io-client already installed"
else
    echo "Installing socket.io-client..."
    npm install socket.io-client
    echo "✅ socket.io-client installed"
fi
echo ""

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Start the backend:"
echo "   cd backened && npm start"
echo ""
echo "2. Start the frontend:"
echo "   cd frontened && npm run dev"
echo ""
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "📚 Documentation: CHAT_SYSTEM_DOCS.md"
echo ""
echo "🎉 Happy chatting!"
