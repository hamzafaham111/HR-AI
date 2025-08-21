#!/bin/bash

# AI Resume Management System - Start Script
# This script starts both the backend and frontend servers

echo "🚀 Starting AI Resume Management System..."

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use. Please stop the service using port $1 first."
        exit 1
    fi
}

# Check if ports are available
echo "🔍 Checking if ports are available..."
check_port 8000
check_port 3000

# Start Backend Server
echo "🐍 Starting Backend Server (FastAPI) on port 8000..."
cd backend
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first:"
    echo "   cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Start backend in background
source venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ Backend failed to start. Check backend.log for details."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend server started successfully!"

# Start Frontend Server
echo "⚛️  Starting Frontend Server (React) on port 3000..."
cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

# Check if frontend started successfully
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Frontend failed to start. Check frontend.log for details."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend server started successfully!"

echo ""
echo "🎉 AI Resume Management System is now running!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop all servers, press Ctrl+C or run: pkill -f 'uvicorn\|react-scripts'"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
wait
