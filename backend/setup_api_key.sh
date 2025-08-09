#!/bin/bash

echo "🔑 DeepSeek API Key Setup"
echo "=========================="
echo ""
echo "To get your DeepSeek API key:"
echo "1. Visit: https://platform.deepseek.com/"
echo "2. Sign up/Login to your account"
echo "3. Go to API Keys section"
echo "4. Create a new API key"
echo ""
echo "Enter your DeepSeek API key (or press Enter to skip):"
read -s api_key

if [ -n "$api_key" ]; then
    # Update the .env file with the new API key
    sed -i '' "s/DEEPSEEK_API_KEY=.*/DEEPSEEK_API_KEY=$api_key/" .env
    echo "✅ API key updated successfully!"
    echo ""
    echo "🔄 Restarting the backend server..."
    echo "Press Ctrl+C to stop the current server, then run:"
    echo "source venv/bin/activate && uvicorn main:app --reload --port 8000"
else
    echo "⏭️  Skipping API key setup for now."
    echo "You can manually edit the .env file later."
fi 