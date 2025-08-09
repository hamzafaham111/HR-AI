#!/bin/bash

# AI Resume Analysis System Setup Script
echo "🚀 Setting up AI Resume Analysis System..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Application Settings
DEBUG=false
LOG_LEVEL=INFO
EOF
    echo "✅ Created .env file. Please update it with your DeepSeek API key."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/uploads backend/logs

# Copy environment example files
echo "📋 Setting up environment files..."
cp backend/env.example backend/.env 2>/dev/null || echo "Backend .env already exists"

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
if curl -f http://localhost:8000/health &> /dev/null; then
    echo "✅ Backend is running at http://localhost:8000"
else
    echo "❌ Backend is not responding"
fi

if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Frontend is running at http://localhost:3000"
else
    echo "❌ Frontend is not responding"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your DeepSeek API key"
echo "2. Visit http://localhost:3000 to use the application"
echo "3. Visit http://localhost:8000/docs for API documentation"
echo ""
echo "🔧 Useful commands:"
echo "  docker-compose up -d          # Start services"
echo "  docker-compose down           # Stop services"
echo "  docker-compose logs -f        # View logs"
echo "  docker-compose restart        # Restart services"
echo "" 