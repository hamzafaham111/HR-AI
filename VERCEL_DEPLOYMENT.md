# 🚀 Vercel Deployment Guide

## 📋 Overview
This guide explains how to deploy your HR Management System (frontend + backend) to Vercel as a monorepo.

## 🏗️ Project Structure
```
your-project/
├── frontend/          # React app
├── backend/           # Python FastAPI app
├── vercel.json        # Vercel configuration
└── package.json       # Root package.json
```

## ⚙️ Vercel Configuration

### vercel.json
The `vercel.json` file configures:
- **Build Command**: Builds the React frontend
- **Output Directory**: Specifies where built files are located
- **Functions**: Maps Python backend to serverless functions
- **Rewrites**: Routes API calls to the backend

## 🌍 Environment Variables

### Frontend Variables (REACT_APP_*)
```
REACT_APP_VERCEL_URL=https://your-project.vercel.app
REACT_APP_ENV=production
```

### Backend Variables
```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
JWT_ALGORITHM=HS256
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=your_openai_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

## 🔧 API Configuration

### Automatic URL Detection
The frontend automatically detects the correct API base URL:
- **Development**: `http://localhost:8000`
- **Production**: Same domain as the frontend (Vercel)

### API Endpoints
All API calls will automatically use the correct base URL:
- `/api/v1/auth/login`
- `/api/v1/jobs/`
- `/api/v1/resume-bank/`
- etc.

## 📱 Deployment Steps

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect the configuration

3. **Set Environment Variables**
   - In Vercel dashboard, go to Project Settings
   - Add all required environment variables
   - Redeploy after adding variables

4. **Deploy**
   - Vercel will automatically build and deploy
   - Frontend: Built from `frontend/` directory
   - Backend: Deployed as serverless functions

## 🔍 Testing Deployment

### Frontend
- Visit your Vercel domain
- Should load the React app

### Backend
- Test API: `https://your-domain.vercel.app/api/v1/health`
- Check docs: `https://your-domain.vercel.app/docs`

## ⚠️ Important Notes

### CORS Configuration
- Backend automatically allows Vercel domains
- No additional CORS setup needed

### File Uploads
- Vercel has limitations for file storage
- Consider using external storage (AWS S3, Cloudinary)

### Database Connections
- Ensure MongoDB Atlas allows connections from Vercel
- Check IP whitelist settings

### Environment Variables
- Never commit sensitive data to Git
- Use Vercel dashboard for all secrets

## 🐛 Troubleshooting

### Build Errors
- Check `vercel.json` syntax
- Verify `package.json` in frontend directory
- Check Python version compatibility

### API Errors
- Verify environment variables are set
- Check MongoDB connection string
- Ensure CORS is properly configured

### Frontend Not Loading
- Check build output directory
- Verify React build command
- Check for JavaScript errors in browser console

## 📞 Support
If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API endpoints individually
4. Check browser console for frontend errors
