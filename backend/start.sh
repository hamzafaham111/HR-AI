#!/bin/bash

echo "🚀 Starting HR AI Backend (NestJS)"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your configuration"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Dev vs Prod start
if [ "$NODE_ENV" = "production" ]; then
    echo "🔨 Building application (production)..."
    npm run build || { echo "❌ Build failed."; exit 1; }
    echo "🚀 Starting application (prod)..."
    npm run start:prod
else
    echo "🚀 Starting application (dev, no build)..."
    npm run start:dev
fi
