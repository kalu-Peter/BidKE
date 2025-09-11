# BidKE API

## 🚀 Quick Start

### Prerequisites
1. PostgreSQL running on localhost:5054
2. Database named 'bidlode' with credentials postgres/webwiz
3. Schema imported from `../database/schema/unified_signup_schema.sql`

### Start the API Server
```bash
cd api
php -S localhost:8000
```

### Test the API
Open `http://localhost:8000/test.html` in your browser to test endpoints.

## 📋 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register.php` | User registration with automatic buyer role |
| POST | `/auth/login.php` | User login with JWT token |
| POST | `/auth/logout.php` | User logout and session cleanup |
| GET | `/auth/profile.php` | Get current user profile (requires auth) |
| GET | `/auth/index.php` | API documentation |

## ✅ Current Status

**CORS Configuration**: ✅ Configured for `http://localhost:8080`
**Database Connection**: ✅ Connected to PostgreSQL (localhost:5054/bidlode)
**Authentication System**: ✅ JWT tokens with role-based access
**API Server**: ✅ Running on `http://localhost:8000`

## 🔧 Features Implemented

- ✅ Unified signup with username-based registration
- ✅ Automatic buyer role assignment
- ✅ JWT token authentication
- ✅ CORS headers for React frontend
- ✅ Input validation and sanitization
- ✅ Rate limiting protection
- ✅ Comprehensive error handling
- ✅ Database singleton pattern with connect.php

## 🚦 API Usage

### Register a new user
```javascript
fetch('http://localhost:8000/auth/register.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'password123'
  })
})
```

### Login
```javascript
fetch('http://localhost:8000/auth/login.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'password123'
  })
})
```

## 📖 Full Documentation

## Overview

The BidKE API models are designed to support the unified signup system with role-based authentication. The system uses PostgreSQL database with comprehensive user management, session tracking, and role-based access control.

## Architecture

### Database Schema
- **users**: Main users table with username-based signup
- **roles**: System roles (buyer, seller, admin)
- **user_roles**: Many-to-many relationship with approval workflow
- **buyer_profiles**: Extended buyer information
- **seller_profiles**: Extended seller information and business details
- **user_sessions**: Login sessions with role tracking
- **email_verifications**: Email verification system
- **password_resets**: Password reset functionality

### Models

#### 1. Database.php
Database connection and transaction management with PostgreSQL support.

**Features:**
- PDO connection with error handling
- Transaction support
- Timezone configuration (Africa/Nairobi)

#### 2. User.php
Main user model handling unified signup and authentication.

**Key Methods:**
- `create()`: Creates user with automatic buyer role assignment
- `findByUsername()`: Login authentication
- `getLoginRoles()`: Get available roles for login
- `verifyEmail()`: Email verification
- `applyForSellerRole()`: Apply for seller privileges
- `logLogin()`: Track role-based logins

**Features:**
- Username-based signup (instead of first/last name)
- Automatic buyer role assignment
- Email verification system
- Account locking after failed attempts
- Profile management

#### 3. UserSession.php
Session management with role tracking and security features.

**Key Methods:**
- `create()`: Create new session
- `findByToken()`: Validate session token
- `updateActivity()`: Track user activity
- `deactivate()`: Logout functionality
- `parseUserAgent()`: Device detection

**Features:**
- Role-based session tracking
- Device fingerprinting
- Security monitoring
- Session cleanup

#### 4. Role.php
Role management system.

**Key Methods:**
- `getAllActive()`: Get all active roles
- `getByName()`: Find role by name
- `create()`: Create new role

#### 5. UserRole.php
Many-to-many relationship between users and roles.

**Key Methods:**
- `assignRole()`: Assign role to user
- `getUserLoginRoles()`: Get active roles for login
- `approveRole()`: Admin approval workflow
- `setPrimaryRole()`: Set primary role

**Features:**
- Role approval workflow
- Primary role management
- Role statistics
- Temporary role support

#### 6. BuyerProfile.php
Extended buyer profile information.

**Key Methods:**
- `getByUserId()`: Get buyer profile
- `update()`: Update profile data
- `updateBiddingStats()`: Track bidding activity
- `verifyNationalId()`: KYC verification

**Features:**
- Bidding preferences and limits
- Payment and shipping preferences
- Rating and review system
- Activity statistics
- Account restrictions

#### 7. SellerProfile.php
Extended seller profile and business information.

**Key Methods:**
- `getByUserId()`: Get seller profile
- `updateVerificationStatus()`: Business verification
- `updateSellingStats()`: Track sales activity
- `canListAuction()`: Permission checking

**Features:**
- Business registration and verification
- Financial information management
- Performance metrics
- Subscription management
- Listing permissions

#### 8. Auth.php
Authentication helper with JWT, validation, and security.

**Key Methods:**
- `generateToken()`: Create JWT tokens
- `verifyToken()`: Validate JWT tokens
- `authenticate()`: Request authentication
- `requireAuth()`: Authentication middleware
- `hasRole()`: Role-based authorization

**Security Features:**
- JWT token management
- Rate limiting
- Input validation and sanitization
- Password strength validation
- Client IP detection
- CORS handling

## API Endpoints

### 1. POST /api/endpoints/register.php
User registration with unified signup.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "+254701234567",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "status": "pending",
      "is_verified": false
    },
    "roles": [
      {
        "role_name": "buyer",
        "is_primary": true,
        "role_status": "active"
      }
    ],
    "verification_required": true,
    "verification_code": "123456"
  }
}
```

### 2. POST /api/endpoints/login.php
Role-based login system.

**Request:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123",
  "login_role": "buyer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user data */ },
    "token": "jwt_token_here",
    "refresh_token": "refresh_token_here",
    "login_role": "buyer",
    "available_roles": ["buyer"],
    "profile": { /* buyer profile data */ },
    "session": {
      "id": 1,
      "expires_at": "2025-10-11T10:30:00Z",
      "device_type": "desktop",
      "browser": "Chrome 91.0"
    }
  }
}
```

### 3. POST /api/endpoints/verify-email.php
Email verification endpoint.

**Request:**
```json
{
  "user_id": 1,
  "verification_code": "123456"
}
```

### 4. POST /api/endpoints/apply-seller.php
Apply for seller role.

**Request:**
```json
{
  "business_name": "My Business Ltd",
  "business_type": "company"
}
```

## Security Features

### Authentication
- JWT tokens with configurable expiry
- Refresh token system
- Session tracking with device information
- Rate limiting on sensitive endpoints

### Validation
- Input sanitization and validation
- Email format validation
- Kenya phone number validation
- Password strength requirements
- Username format validation

### Authorization
- Role-based access control
- Route protection middleware
- Permission checking
- Admin role privileges

### Security Monitoring
- Failed login attempt tracking
- Account locking mechanism
- Suspicious activity flagging
- IP-based rate limiting

## Database Functions

The schema includes several PostgreSQL functions for common operations:

### create_user_with_buyer_role()
Creates a new user with automatic buyer role assignment.

### apply_for_seller_role()
Handles seller role applications with business information.

### get_user_login_roles()
Returns available roles for user login with permission checking.

### log_user_login()
Logs user login with role selection and device information.

## Usage Examples

### Basic Registration Flow
```php
// 1. User registers with username
$user = new User($db);
$user->username = "john_doe";
$user->email = "john@example.com";
$user->password_hash = Auth::hashPassword("password");
$user_id = $user->create(); // Automatically gets buyer role

// 2. User verifies email
$user->verifyEmail("123456");

// 3. User can now login as buyer
```

### Role-Based Login
```php
// 1. Authenticate user
$user = new User($db);
$user->findByUsername("john_doe");

// 2. Check available roles
$roles = $user->getLoginRoles();

// 3. Create session with selected role
$session = new UserSession($db);
// ... session creation logic

// 4. Generate JWT with role
$token = Auth::generateToken($user->id, $user->username, "buyer");
```

### Seller Application
```php
// 1. User applies for seller role
$user->applyForSellerRole("My Business", "company");

// 2. Admin approves application
$userRole = new UserRole($db);
$userRole->approveRole($user_role_id, $admin_user_id);

// 3. User can now login as seller
```

## Configuration

### Database Settings
Update `api/config/Database.php` with your PostgreSQL credentials:
```php
private $host = "localhost";
private $db_name = "bidke_db";
private $username = "postgres";
private $password = "your_password";
```

### JWT Settings
Update `api/models/Auth.php` with your secret key:
```php
private static $jwt_secret = "your-secret-key-here";
```

### CORS Settings
Update CORS headers in endpoint files for your frontend URL:
```php
header("Access-Control-Allow-Origin: http://localhost:5173");
```

This API system provides a robust foundation for the unified signup and role-based authentication system in BidKE.
