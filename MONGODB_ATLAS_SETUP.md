# MongoDB Atlas Setup Guide

This guide will help you set up MongoDB Atlas (cloud MongoDB) instead of using a local MongoDB installation, and show you how to connect MongoDB Compass to view your data.

## Step 1: Create MongoDB Atlas Account

1. **Sign up for MongoDB Atlas**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Click "Try Free" or "Sign Up"
   - Create an account or sign in with Google/GitHub

2. **Create a new project**:
   - Click "New Project"
   - Give it a name (e.g., "AI Resume Analysis")
   - Click "Next" and then "Create Project"

## Step 2: Create a Cluster

1. **Build a database**:
   - Click "Build a Database"
   - Choose "FREE" tier (M0)
   - Select your preferred cloud provider (AWS, Google Cloud, or Azure)
   - Choose a region close to your location
   - Click "Create"

2. **Set up database access**:
   - Create a database user:
     - Username: Choose a username (e.g., `resume_admin`)
     - Password: Create a strong password
     - **IMPORTANT**: Save these credentials securely
   - Click "Create User"

3. **Set up network access**:
   - Click "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific IP addresses
   - Click "Confirm"

## Step 3: Get Your Connection String

1. **Get the connection string**:
   - Go back to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Select "Python" as your driver
   - Copy the connection string

2. **Format the connection string**:
   Replace the placeholder with your actual credentials:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/resume_analysis?retryWrites=true&w=majority
   ```

## Step 4: Update Your Environment Variables

1. **Create/update your `.env` file**:
   ```bash
   # In your backend directory
   cp env.example .env
   ```

2. **Edit the `.env` file**:
   ```env
   # MongoDB Atlas Configuration
   MONGODB_URL=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/resume_analysis?retryWrites=true&w=majority
   DATABASE_NAME=resume_analysis
   ```

## Step 5: Connect MongoDB Compass

1. **Download MongoDB Compass**:
   - Go to [MongoDB Compass](https://www.mongodb.com/products/compass)
   - Download and install for your operating system

2. **Connect to your Atlas cluster**:
   - Open MongoDB Compass
   - Click "New Connection"
   - Paste your connection string from Step 3
   - Click "Connect"

3. **Navigate your database**:
   - You'll see your `resume_analysis` database
   - Click on it to explore collections
   - You can view, edit, and manage your data through the GUI

## Step 6: Test Your Connection

1. **Start your application**:
   ```bash
   # If using Docker
   docker-compose up -d
   
   # If running locally
   cd backend
   python main.py
   ```

2. **Verify connection**:
   - Check your application logs for successful MongoDB connection
   - In MongoDB Compass, you should see data being created when you use the app

## Step 7: Security Best Practices

1. **Environment Variables**:
   - Never commit your `.env` file to version control
   - Use different credentials for development and production

2. **Network Access**:
   - For production, restrict IP access to your application servers
   - Regularly review and update IP whitelist

3. **Database Users**:
   - Use different users for different environments
   - Grant minimal required permissions

## Troubleshooting

### Connection Issues
- **Authentication failed**: Check username/password in connection string
- **Network timeout**: Verify IP whitelist includes your IP
- **SSL issues**: Ensure connection string includes `?retryWrites=true&w=majority`

### Compass Connection Issues
- **Connection refused**: Check if your IP is whitelisted
- **Authentication error**: Verify credentials in connection string
- **SSL certificate error**: Try adding `&ssl=true` to connection string

## Benefits of MongoDB Atlas

1. **No local installation required**
2. **Automatic backups and scaling**
3. **Built-in monitoring and alerts**
4. **Global distribution**
5. **Easy collaboration with team members**
6. **Access from anywhere with internet connection**

## Cost Considerations

- **Free Tier**: 512MB storage, shared RAM, suitable for development
- **Paid Plans**: Start at $9/month for dedicated resources
- **Scaling**: Pay only for what you use

## Next Steps

1. **Monitor your usage** in Atlas dashboard
2. **Set up alerts** for storage and performance
3. **Configure backups** (automatic with paid plans)
4. **Set up monitoring** for your application

Your MongoDB Atlas setup is now complete! You can use MongoDB Compass to visually explore and manage your data, and your application will connect to the cloud database instead of requiring a local MongoDB installation. 