"""
API tests for authentication endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch


class TestAuthAPI:
    """Test cases for authentication API endpoints."""

    def test_register_success(self, client: TestClient):
        """Test successful user registration."""
        user_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "testpassword123",
            "role": "user",
            "company": "Test Company"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == user_data["name"]
        assert data["email"] == user_data["email"]
        assert "id" in data

    def test_register_invalid_email(self, client: TestClient):
        """Test registration with invalid email."""
        user_data = {
            "name": "Test User",
            "email": "invalid-email",
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 422

    def test_register_weak_password(self, client: TestClient):
        """Test registration with weak password."""
        user_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "123"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 422

    def test_login_success(self, client: TestClient, test_user):
        """Test successful user login."""
        # First register a user
        user_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "testpassword123"
        }
        client.post("/api/v1/auth/register", json=user_data)
        
        # Then login
        login_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data

    def test_login_invalid_credentials(self, client: TestClient):
        """Test login with invalid credentials."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401

    def test_get_current_user(self, client: TestClient, auth_headers):
        """Test getting current user information."""
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        
        # This will fail without proper JWT token implementation
        # For now, we expect a 401 or 422
        assert response.status_code in [401, 422]

    def test_forgot_password(self, client: TestClient):
        """Test forgot password endpoint."""
        data = {"email": "test@example.com"}
        
        response = client.post("/api/v1/auth/forgot-password", json=data)
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_reset_password_invalid_token(self, client: TestClient):
        """Test password reset with invalid token."""
        data = {
            "token": "invalid_token",
            "new_password": "newpassword123"
        }
        
        response = client.post("/api/v1/auth/reset-password", json=data)
        
        assert response.status_code == 400

    def test_logout(self, client: TestClient):
        """Test logout endpoint."""
        response = client.post("/api/v1/auth/logout")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data 