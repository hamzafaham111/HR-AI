"""
Authentication API Module

This module handles all authentication-related functionality including:
- User registration and login
- JWT token creation and validation
- Password hashing and verification
- User profile management
- Token refresh mechanisms

Key Concepts for React Developers:
- FastAPI decorators (@router.post) are like Express.js route handlers
- async/await works the same as in JavaScript
- Pydantic models are like TypeScript interfaces for data validation
- Dependencies (Depends()) are like middleware functions
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt  # JSON Web Tokens for secure authentication
import bcrypt  # For password hashing (like bcrypt in Node.js)
from bson import ObjectId  # MongoDB's unique identifier type

from app.core.config import settings
from app.core.database import get_database
from app.models.auth import (
    UserCreate, UserLogin, UserResponse, TokenResponse, 
    RefreshTokenRequest, ForgotPasswordRequest, ResetPasswordRequest,
    ProfileUpdateRequest, PasswordChangeRequest, AccountSettingsRequest
)
from app.models.mongodb_models import UserDocument, COLLECTIONS
from app.utils.email_service import send_password_reset_email, send_welcome_email
from loguru import logger

# Create FastAPI router - like Express Router
router = APIRouter()
# Security scheme for JWT token extraction from Authorization header
security = HTTPBearer()

# JWT Configuration - These are the "secrets" used to sign tokens
SECRET_KEY = settings.secret_key  # Used for access tokens
REFRESH_SECRET_KEY = settings.refresh_secret_key or "your-refresh-secret-key-here"  # Used for refresh tokens
ALGORITHM = settings.algorithm  # Encryption algorithm (usually HS256)
ACCESS_TOKEN_EXPIRE_MINUTES = 25  # Short-lived for security (like session timeout)
REFRESH_TOKEN_EXPIRE_DAYS = 7     # Longer-lived for convenience

# JWT Token Creation Functions
# These functions create JWT tokens that contain user information and expiration time

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create an access token for API authentication.
    
    Similar to creating a session token, but stateless.
    The token contains user ID and expiration time.
    
    Args:
        data: Dictionary containing user information (usually {"sub": user_id})
        expires_delta: Custom expiration time (optional)
    
    Returns:
        String: JWT token that can be sent to frontend
    """
    to_encode = data.copy()  # Copy data to avoid modifying original
    
    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add expiration and token type to payload
    to_encode.update({"exp": expire, "type": "access"})
    
    # Create and return JWT token (like signing a cookie but more secure)
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a refresh token for renewing access tokens.
    
    Think of this like a "remember me" token that lasts longer
    and can be used to get new access tokens without re-login.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Dependency to get current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    database = Depends(get_database)
) -> UserDocument:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    logger.warning(f"Authentication attempt - credentials: {credentials.credentials[:20]}...")
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        logger.warning(f"Token payload - user_id: {user_id}, token_type: {token_type}")
        
        if user_id is None or token_type != "access":
            logger.warning(f"Invalid token - user_id: {user_id}, token_type: {token_type}")
            raise credentials_exception
    except jwt.PyJWTError as e:
        logger.warning(f"JWT decode error: {e}")
        raise credentials_exception
    
    # Find user in MongoDB
    user_data = await database[COLLECTIONS["users"]].find_one({"_id": ObjectId(user_id)})
    if user_data is None:
        raise credentials_exception
    
    # Convert to UserDocument
    user_data["id"] = str(user_data["_id"])
    user = UserDocument(**user_data)
    
    return user

async def get_current_user_from_refresh_token(
    refresh_token: str,
    database = Depends(get_database)
) -> UserDocument:
    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Find user in MongoDB
    user_data = await database[COLLECTIONS["users"]].find_one({"_id": ObjectId(user_id)})
    if user_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Convert to UserDocument
    user_data["id"] = str(user_data["_id"])
    user = UserDocument(**user_data)
    
    return user

# API Routes
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, database = Depends(get_database)):
    """Register a new user."""
    # Check if user already exists
    logger.warning(f"Checking for existing user with email: {user_data.email}")
    existing_user = await database[COLLECTIONS["users"]].find_one({"email": user_data.email})
    logger.warning(f"Result of existing user query: {existing_user}")
    if existing_user:
        logger.warning(f"User already exists: {existing_user}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "role": user_data.role,
        "company": user_data.company,
        "phone": None,
        "is_active": True,
        "is_superuser": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await database[COLLECTIONS["users"]].insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    user_doc["id"] = str(result.inserted_id)
    
    # Send welcome email (in background)
    try:
        send_welcome_email(user_data.email, user_data.name)
    except Exception as e:
        # Log error but don't fail registration
        print(f"Failed to send welcome email: {e}")
    
    return UserResponse(**user_doc)

@router.post("/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin, database = Depends(get_database)):
    """Login user and return access/refresh tokens."""
    user_data = await database[COLLECTIONS["users"]].find_one({"email": user_credentials.email})
    
    if not user_data or not verify_password(user_credentials.password, user_data["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user_data["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated"
        )
    
    # Create tokens
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    user_id = str(user_data["_id"])
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": user_id}, expires_delta=refresh_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # seconds
        user=UserResponse(
            id=user_id,
            name=user_data["name"],
            email=user_data["email"],
            role=user_data["role"],
            company=user_data.get("company"),
            phone=user_data.get("phone"),
            is_active=user_data["is_active"],
            created_at=user_data["created_at"]
        )
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_token_request: RefreshTokenRequest,
    database = Depends(get_database)
):
    """Refresh access token using refresh token."""
    try:
        # Verify refresh token and get user
        user = await get_current_user_from_refresh_token(
            refresh_token_request.refresh_token, database
        )
        
        # Create new access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_request.refresh_token,  # Keep same refresh token
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                company=user.company,
                is_active=user.is_active,
                created_at=user.created_at
            )
        )
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserDocument = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        company=current_user.company,
        phone=current_user.phone,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, database = Depends(get_database)):
    """Send password reset email."""
    user = database.query(User).filter(User.email == request.email).first()
    
    if user:
        # Generate reset token (in a real app, this would be stored in database)
        reset_token = "reset_token_placeholder"  # In production, generate proper token
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        database.commit()
        
        # Send reset email
        try:
            send_password_reset_email(user.email, reset_token)
        except Exception as e:
            print(f"Failed to send password reset email: {e}")
    
    # Always return success to prevent email enumeration
    return {"message": "If an account with that email exists, a password reset link has been sent."}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, database = Depends(get_database)):
    """Reset password using token."""
    user = database.query(User).filter(
        User.reset_token == request.token,
        User.reset_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    database.commit()
    
    return {"message": "Password has been reset successfully"}

@router.post("/logout")
async def logout():
    """Logout user (client should discard tokens)."""
    return {"message": "Successfully logged out"}

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdateRequest,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """Update user profile information."""
    # Check if email is already taken by another user
    if profile_data.email != current_user.email:
        existing_user = database[COLLECTIONS["users"]].find_one({
            "email": profile_data.email,
            "_id": {"$ne": current_user.id}
        })
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered by another user"
            )
    
    # Update user profile
    update_data = {
        "name": f"{profile_data.first_name} {profile_data.last_name}",
        "email": profile_data.email,
        "phone": profile_data.phone,
        "updated_at": datetime.utcnow()
    }
    
    result = database[COLLECTIONS["users"]].update_one(
        {"_id": current_user.id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )
    
    # Get updated user data
    updated_user = database[COLLECTIONS["users"]].find_one({"_id": current_user.id})
    
    return UserResponse(
        id=str(updated_user["_id"]),
        name=updated_user["name"],
        email=updated_user["email"],
        role=updated_user["role"],
        company=updated_user.get("company"),
        phone=updated_user.get("phone"),
        is_active=updated_user["is_active"],
        created_at=updated_user["created_at"]
    )

@router.put("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """Change user password."""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_hashed_password = get_password_hash(password_data.new_password)
    
    # Update password
    result = database[COLLECTIONS["users"]].update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "hashed_password": new_hashed_password,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password"
        )
    
    return {"message": "Password changed successfully"}

@router.put("/settings")
async def update_account_settings(
    settings_data: AccountSettingsRequest,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """Update user account settings."""
    # Update settings
    result = database[COLLECTIONS["users"]].update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "settings": {
                    "email_notifications": settings_data.email_notifications,
                    "job_alerts": settings_data.job_alerts,
                    "resume_updates": settings_data.resume_updates
                },
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update settings"
        )
    
    return {"message": "Account settings updated successfully"} 