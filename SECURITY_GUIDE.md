# Security Implementation Guide

This document explains the security measures implemented in the AI Resume Management System and how they protect user data.

## 🔐 Password Security

### ✅ FIXED: Password Hashing Implementation

**Problem**: Previously, passwords might have been stored in plain text (security vulnerability).

**Solution**: Implemented bcrypt password hashing:

```python
# In backend/app/api/auth.py

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt with salt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# Registration endpoint
@router.post("/register")
async def register(user_data: UserCreate):
    # Hash password before storing
    hashed_password = get_password_hash(user_data.password)
    user_doc = {
        "email": user_data.email,
        "hashed_password": hashed_password,  # Store hash, not plain text
        # ... other fields
    }
    await database.users.insert_one(user_doc)

# Login endpoint  
@router.post("/login")
async def login(user_credentials: UserLogin):
    user_data = await database.users.find_one({"email": user_credentials.email})
    
    # Verify password against stored hash
    if not verify_password(user_credentials.password, user_data["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
```

**How it works**:
1. **Registration**: Plain password → bcrypt hash → store hash in database
2. **Login**: Plain password + stored hash → bcrypt verification → success/failure
3. **Security**: Even if database is compromised, passwords are protected by strong hashing

## 🔑 Environment Variables & Configuration

### ✅ FIXED: Centralized Configuration Management

**Problem**: Sensitive data (API keys, database URLs) were hardcoded in source files.

**Solution**: Moved all sensitive data to environment variables:

#### Backend Environment Variables (`.env`):
```bash
# Database (sensitive)
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/db

# OpenAI API (sensitive) 
OPENAI_API_KEY=sk-your-openai-api-key-here

# JWT Secrets (very sensitive)
SECRET_KEY=your-super-secret-key-64-chars-minimum
REFRESH_SECRET_KEY=your-refresh-token-secret

# Application settings
DEBUG=true
ENVIRONMENT=development
```

#### Frontend Environment Variables (`.env`):
```bash
# API Configuration (non-sensitive)
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_BASE_PATH=/api/v1

# App Configuration (non-sensitive)
REACT_APP_NAME="AI Resume Management"
REACT_APP_ENV=development
```

#### Centralized API Configuration:
```javascript
// frontend/src/config/api.js
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
    // ... other endpoints
  },
  // ... other endpoint groups
};
```

## 🛡️ JWT Token Security

### How JWT Authentication Works:

1. **User Login**:
   ```
   User submits credentials → Backend verifies → Generate JWT tokens
   ```

2. **Token Structure**:
   ```javascript
   // Access Token (short-lived: 15 minutes)
   {
     "sub": "user_id",           // Subject (user identifier)
     "exp": 1234567890,          // Expiration timestamp
     "type": "access",           // Token type
     "iat": 1234567890           // Issued at timestamp
   }
   
   // Refresh Token (long-lived: 7 days)  
   {
     "sub": "user_id",
     "exp": 1234567890,
     "type": "refresh"
   }
   ```

3. **API Request Protection**:
   ```javascript
   // Frontend automatically adds to requests
   headers: {
     'Authorization': 'Bearer <access_token>'
   }
   
   // Backend validates on each request
   async def get_current_user(credentials: HTTPAuthorizationCredentials):
       payload = jwt.decode(credentials.credentials, SECRET_KEY)
       user_id = payload.get("sub")
       # ... validate and return user
   ```

4. **Automatic Token Refresh**:
   ```javascript
   // When access token expires (401 error)
   if (response.status === 401) {
     const newToken = await refreshAccessToken();
     // Retry original request with new token
   }
   ```

## 🔒 Data Isolation & User Security

### User-Based Data Filtering:

Every API endpoint filters data by the authenticated user:

```python
# Example: Get user's resumes only
@router.get("/resume-bank/")
async def get_resume_bank(current_user: UserDocument = Depends(get_current_user)):
    # Only return resumes belonging to this user
    resumes = await database.resume_bank_entries.find({
        "user_id": ObjectId(current_user.id)  # Filter by user ID
    }).to_list(length=100)
    return resumes
```

This ensures:
- Users can only see their own data
- No cross-user data leakage
- Secure multi-tenant architecture

## 📁 File Upload Security

### PDF Upload Protection:

```python
# File type validation
if file.content_type != 'application/pdf':
    raise HTTPException(400, "Only PDF files allowed")

# File size limits
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Secure file handling
filename = secure_filename(file.filename)
file_path = os.path.join(UPLOAD_DIR, filename)
```

## 🚫 What's Protected in Git

### Files Excluded from Version Control:

```gitignore
# Environment files (contain secrets)
.env
.env.local
.env.development.local
backend/.env
frontend/.env

# Database files
*.db
*.sqlite

# Uploaded files
uploads/
qdrant_storage/

# Dependencies
node_modules/
venv/

# Logs (may contain sensitive data)
*.log
logs/
```

## ⚠️ Security Best Practices Implemented

### ✅ Password Security:
- ✅ bcrypt hashing with salt
- ✅ No plain text password storage
- ✅ Secure password verification

### ✅ API Security:
- ✅ JWT token authentication
- ✅ Token expiration (15 min access, 7 day refresh)
- ✅ Automatic token refresh
- ✅ Protected routes require authentication

### ✅ Data Security:
- ✅ User-based data isolation
- ✅ Database query filtering by user ID
- ✅ No cross-user data access

### ✅ Configuration Security:
- ✅ Environment variables for secrets
- ✅ No hardcoded API keys or passwords
- ✅ Centralized configuration management
- ✅ .gitignore protects sensitive files

### ✅ File Upload Security:
- ✅ File type validation (PDF only)
- ✅ File size limits
- ✅ Secure file naming

## 🔍 Security Verification Checklist

### To verify your setup is secure:

#### Backend Security:
```bash
# 1. Check .env file exists and has required secrets
ls backend/.env

# 2. Verify .env is not tracked by git
git status backend/.env  # Should show "ignored"

# 3. Check password hashing is working
# Register a user and check database - password should be hashed
```

#### Frontend Security:
```bash
# 1. Check environment variables are loaded
npm start
# Check browser console for API configuration debug output

# 2. Verify API URLs are not hardcoded
grep -r "localhost:8000" src/  # Should only be in config files

# 3. Check .env is not tracked
git status frontend/.env  # Should show "ignored"  
```

#### Database Security:
```bash
# 1. Verify user data isolation
# Login as different users - each should only see their own data

# 2. Check password storage
# Look at users collection - passwords should be bcrypt hashes
```

## 🚨 Security Incident Response

### If you suspect a security breach:

1. **Immediate Actions**:
   - Rotate all JWT secrets (`SECRET_KEY`, `REFRESH_SECRET_KEY`)
   - Change database passwords
   - Revoke and regenerate API keys

2. **Investigation**:
   - Check application logs for unusual activity
   - Review database access logs
   - Audit user access patterns

3. **Recovery**:
   - Force all users to re-authenticate
   - Update security measures
   - Document lessons learned

## 📚 Additional Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [bcrypt Documentation](https://pypi.org/project/bcrypt/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

---

**Remember**: Security is an ongoing process. Regularly review and update these measures as your application grows!
