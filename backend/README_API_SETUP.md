# 🔑 DeepSeek API Key Setup

## Quick Setup

### Option 1: Use the setup script
```bash
./setup_api_key.sh
```

### Option 2: Manual setup
1. Get your API key from: https://platform.deepseek.com/
2. Edit the `.env` file:
   ```bash
   nano .env
   ```
3. Replace `your_deepseek_api_key_here` with your actual API key
4. Save and restart the backend

### Option 3: Direct command
```bash
# Replace YOUR_API_KEY_HERE with your actual key
sed -i '' 's/DEEPSEEK_API_KEY=.*/DEEPSEEK_API_KEY=YOUR_API_KEY_HERE/' .env
```

## After updating the API key:
1. Restart the backend server
2. Test by uploading a resume
3. Check the analysis results

## Current Status:
- ✅ Frontend: http://localhost:3000
- ✅ Backend: http://localhost:8000
- ⚠️ API Key: Needs to be configured 