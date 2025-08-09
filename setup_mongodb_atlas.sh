#!/bin/bash

# MongoDB Atlas Setup Script
# This script helps you configure MongoDB Atlas for your AI Resume Analysis project

echo "🚀 MongoDB Atlas Setup for AI Resume Analysis"
echo "=============================================="

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating .env file from template..."
    cp backend/env.example backend/.env
    echo "✅ .env file created"
else
    echo "📝 .env file already exists"
fi

echo ""
echo "🔧 Next Steps:"
echo "1. Go to https://www.mongodb.com/atlas and create a free account"
echo "2. Create a new cluster (FREE tier)"
echo "3. Set up database access (create username/password)"
echo "4. Set up network access (allow your IP or 0.0.0.0/0 for development)"
echo "5. Get your connection string from the 'Connect' button"
echo ""
echo "📝 Update your backend/.env file with:"
echo "   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/resume_analysis?retryWrites=true&w=majority"
echo "   DATABASE_NAME=resume_analysis"
echo ""
echo "🔍 To view your data with MongoDB Compass:"
echo "1. Download MongoDB Compass from https://www.mongodb.com/products/compass"
echo "2. Use the same connection string to connect"
echo "3. Navigate to your resume_analysis database"
echo ""
echo "📚 For detailed instructions, see MONGODB_ATLAS_SETUP.md"
echo ""
echo "🎯 Once configured, start your application with:"
echo "   docker-compose up -d"
echo "   or"
echo "   cd backend && python main.py" 