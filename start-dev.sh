#!/bin/bash
# Development Server Startup Script for BidKE

echo "🚀 Starting BidKE Development Environment..."
echo ""

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Check required ports
echo "📡 Checking ports..."
check_port 8000  # PHP API server
check_port 8082  # Vite dev server
check_port 5054  # PostgreSQL local

echo ""
echo "🔧 Environment Configuration:"
echo "   • Frontend: http://localhost:8082"
echo "   • API Server: http://localhost:8000"
echo "   • Database: localhost:5054"
echo ""

# Start PHP development server in background
echo "🐘 Starting PHP API server on port 8000..."
cd api
php -S localhost:8000 &
PHP_PID=$!
cd ..

# Wait a moment for PHP server to start
sleep 2

# Start Vite development server
echo "⚛️  Starting Vite development server on port 8082..."
npm run dev &
VITE_PID=$!

echo ""
echo "🎉 Development servers started!"
echo "   • Frontend: http://localhost:8082"
echo "   • API: http://localhost:8000"
echo ""
echo "📝 Logs will appear below..."
echo "   Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $PHP_PID 2>/dev/null
    kill $VITE_PID 2>/dev/null
    echo "✅ Development servers stopped"
    exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup INT

# Wait for background processes
wait