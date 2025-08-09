# Database Setup Guide

This guide explains how to set up the database for the AI Resume Analysis System.

## Database Options

The system supports two database options:

### 1. SQLite (Development - Default)
- **File-based**: No server setup required
- **Perfect for development**: Easy to set up and use
- **Automatic**: Creates `resume_analysis.db` in the backend directory

### 2. PostgreSQL (Production)
- **Server-based**: Requires PostgreSQL installation
- **Better for production**: Scalable and robust
- **Environment variable**: Set `DATABASE_URL` in `.env` file

## Quick Setup

### Option 1: SQLite (Recommended for Development)

1. **Install dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run the setup script**:
   ```bash
   python setup_database.py
   ```

3. **Start the application**:
   ```bash
   python main.py
   ```

### Option 2: PostgreSQL (Production)

1. **Install PostgreSQL**:
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create database**:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE resume_analysis;
   CREATE USER resume_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE resume_analysis TO resume_user;
   \q
   ```

3. **Set environment variable**:
   ```bash
   # Add to .env file
   DATABASE_URL=postgresql://resume_user:your_password@localhost/resume_analysis
   ```

4. **Run setup**:
   ```bash
   python setup_database.py
   ```

## Database Schema

The system creates the following tables:

### 1. `job_postings`
- Job posting information
- Requirements, responsibilities, benefits
- Status tracking (active, closed, draft)

### 2. `resume_analyses`
- Resume analysis results
- AI-generated insights
- Processing status

### 3. `resume_bank_entries`
- Candidate information
- Professional details
- Skills and tags

### 4. `candidate_matches`
- Job-candidate matching records
- Match scores and criteria
- Tracking of hiring process

## Setup Script Options

The `setup_database.py` script supports several options:

```bash
# Basic setup
python setup_database.py

# Drop existing tables and recreate
python setup_database.py --drop

# Create with sample data
python setup_database.py --sample

# Drop and create with sample data
python setup_database.py --drop --sample
```

## Environment Variables

Add these to your `.env` file:

```env
# Database (optional - defaults to SQLite)
DATABASE_URL=postgresql://user:password@localhost/dbname

# Database debugging (optional)
DATABASE_ECHO=true
```

## Migration and Schema Changes

For production deployments, use Alembic for database migrations:

1. **Initialize Alembic**:
   ```bash
   alembic init alembic
   ```

2. **Create migration**:
   ```bash
   alembic revision --autogenerate -m "Initial migration"
   ```

3. **Apply migration**:
   ```bash
   alembic upgrade head
   ```

## Troubleshooting

### Common Issues

1. **SQLite Permission Error**:
   ```bash
   # Make sure the backend directory is writable
   chmod 755 backend/
   ```

2. **PostgreSQL Connection Error**:
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   
   # Check connection
   psql -h localhost -U resume_user -d resume_analysis
   ```

3. **Import Errors**:
   ```bash
   # Make sure you're in the backend directory
   cd backend
   python setup_database.py
   ```

### Reset Database

To completely reset the database:

```bash
# Drop all tables
python -c "from app.core.init_db import drop_db; drop_db()"

# Recreate tables
python setup_database.py
```

## Production Considerations

1. **Backup Strategy**: Set up regular database backups
2. **Connection Pooling**: Configure connection pooling for high traffic
3. **Monitoring**: Set up database monitoring and alerting
4. **Security**: Use strong passwords and restrict database access
5. **Performance**: Add indexes for frequently queried columns

## Sample Data

The setup script can create sample data including:
- Sample job posting (Senior Software Engineer)
- Sample resume bank entry (John Doe)
- Sample candidate matches

This helps you test the system immediately after setup.

## Next Steps

After setting up the database:

1. Start the backend server: `python main.py`
2. Start the frontend: `npm start` (in frontend directory)
3. Visit http://localhost:3000
4. Create your first job posting
5. Upload some resumes to the resume bank
6. Test the candidate matching functionality 