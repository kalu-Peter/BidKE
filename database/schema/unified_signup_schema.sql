-- =====================================================
-- BidKE Unified Signup Schema
-- Single signup form with username + role-based login
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS seller_profiles CASCADE;
DROP TABLE IF EXISTS buyer_profiles CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- =====================================================
-- 1. ROLES TABLE
-- =====================================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    can_login BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (role_name, display_name, description) VALUES
('buyer', 'Buyer', 'Can browse and bid on auction items'),
('seller', 'Seller', 'Can list items for auction and manage sales'),
('admin', 'Administrator', 'System administration and management');

-- =====================================================
-- 2. USERS TABLE (Unified Signup)
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    
    -- Core signup fields
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    
    -- Status and verification
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'inactive', 'banned')),
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    phone_verified_at TIMESTAMP NULL,
    
    -- Email verification
    verification_code VARCHAR(10),
    verification_expires TIMESTAMP,
    
    -- Phone verification
    phone_verification_code VARCHAR(6),
    phone_verification_expires TIMESTAMP,
    
    -- Profile information (optional)
    avatar_url VARCHAR(500),
    full_name VARCHAR(255), -- Can be updated later or derived from username
    bio TEXT,
    date_of_birth DATE,
    
    -- Address information (optional, can be updated later)
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Kenya',
    
    -- Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    
    -- Security and login tracking
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    last_login_role VARCHAR(50), -- Track which role they last logged in as
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    -- Two-factor authentication
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_verification_code ON users(verification_code);
CREATE INDEX idx_users_phone_verification_code ON users(phone_verification_code);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- 3. USER ROLES (Many-to-Many Relationship)
-- =====================================================
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    
    -- Role management
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Application and approval tracking
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    approved_by INTEGER REFERENCES users(id) NULL,
    
    -- Role-specific status
    role_status VARCHAR(20) DEFAULT 'active' CHECK (role_status IN ('pending', 'active', 'suspended', 'rejected')),
    
    -- Expiration (for temporary roles)
    expires_at TIMESTAMP NULL,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, role_id)
);

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_primary ON user_roles(user_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_user_roles_active ON user_roles(user_id, is_active) WHERE is_active = TRUE;

-- =====================================================
-- 4. BUYER PROFILES (Extended buyer information)
-- =====================================================
CREATE TABLE buyer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- KYC Information
    national_id VARCHAR(50) UNIQUE,
    national_id_verified BOOLEAN DEFAULT FALSE,
    national_id_document_url VARCHAR(500),
    
    -- Bidding preferences
    preferred_categories TEXT[], -- Array of category names/IDs
    max_bid_limit DECIMAL(15,2) DEFAULT 0,
    auto_bid_enabled BOOLEAN DEFAULT FALSE,
    bid_increment_preference DECIMAL(10,2) DEFAULT 100.00,
    
    -- Shipping preferences
    default_shipping_address TEXT,
    shipping_instructions TEXT,
    preferred_delivery_time VARCHAR(50),
    
    -- Payment preferences
    preferred_payment_methods TEXT[], -- Array of payment method types
    
    -- Buying statistics
    total_bids INTEGER DEFAULT 0,
    successful_bids INTEGER DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    average_bid_amount DECIMAL(15,2) DEFAULT 0,
    won_auctions INTEGER DEFAULT 0,
    
    -- Ratings and reviews
    buyer_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    
    -- Notification preferences
    bid_notifications BOOLEAN DEFAULT TRUE,
    outbid_notifications BOOLEAN DEFAULT TRUE,
    winning_notifications BOOLEAN DEFAULT TRUE,
    auction_ending_notifications BOOLEAN DEFAULT TRUE,
    
    -- Account limits and restrictions
    credit_limit DECIMAL(15,2) DEFAULT 0,
    is_restricted BOOLEAN DEFAULT FALSE,
    restriction_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. SELLER PROFILES (Extended seller information)
-- =====================================================
CREATE TABLE seller_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Business Information
    business_name VARCHAR(255),
    business_type VARCHAR(50) CHECK (business_type IN (
        'individual', 'sole_proprietorship', 'partnership', 'company', 
        'auctioneer', 'bank', 'microfinance', 'sacco', 'dealer', 
        'leasing_company', 'government', 'ngo', 'other'
    )) DEFAULT 'individual',
    
    -- Business Registration
    business_registration VARCHAR(100) UNIQUE,
    tax_pin VARCHAR(50) UNIQUE,
    business_permit VARCHAR(100),
    
    -- Business verification status
    business_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected', 'expired')),
    verification_documents TEXT[], -- Array of document URLs
    verified_at TIMESTAMP,
    verified_by INTEGER REFERENCES users(id),
    verification_notes TEXT,
    
    -- Business Contact Information
    business_address TEXT,
    business_phone VARCHAR(20),
    business_email VARCHAR(255),
    website_url VARCHAR(500),
    business_description TEXT,
    
    -- Operating Information
    operating_hours JSONB, -- Store as JSON: {"monday": "9:00-17:00", ...}
    service_areas TEXT[], -- Array of areas they serve
    specializations TEXT[], -- Array of specialization categories
    
    -- Financial Information
    bank_account_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(255),
    bank_branch VARCHAR(255),
    bank_code VARCHAR(20),
    mobile_money_number VARCHAR(20),
    mobile_money_provider VARCHAR(50),
    
    -- Seller Settings
    commission_rate DECIMAL(5,2) DEFAULT 5.00, -- Platform commission percentage
    listing_fee DECIMAL(10,2) DEFAULT 0.00,
    auto_renewal BOOLEAN DEFAULT FALSE,
    reserve_price_required BOOLEAN DEFAULT FALSE,
    immediate_payment_required BOOLEAN DEFAULT TRUE,
    
    -- Selling Statistics
    total_listings INTEGER DEFAULT 0,
    active_listings INTEGER DEFAULT 0,
    completed_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    average_sale_price DECIMAL(15,2) DEFAULT 0,
    
    -- Performance Metrics
    seller_rating DECIMAL(3,2) DEFAULT 0.00,
    total_seller_reviews INTEGER DEFAULT 0,
    response_time_hours DECIMAL(5,2) DEFAULT 24.00,
    fulfillment_rate DECIMAL(5,2) DEFAULT 100.00,
    
    -- Account Status
    seller_status VARCHAR(20) DEFAULT 'active' CHECK (seller_status IN ('pending', 'active', 'suspended', 'restricted', 'banned')),
    can_list_auctions BOOLEAN DEFAULT TRUE,
    can_accept_payments BOOLEAN DEFAULT TRUE,
    max_active_listings INTEGER DEFAULT 50,
    
    -- Subscription and features
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_expires_at TIMESTAMP,
    featured_listings_remaining INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. USER SESSIONS (Login tracking and security)
-- =====================================================
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session tokens
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    
    -- Login context
    login_role VARCHAR(50) NOT NULL, -- Which role they logged in as
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Device information
    device_type VARCHAR(50), -- mobile, desktop, tablet
    browser VARCHAR(100),
    operating_system VARCHAR(100),
    
    -- Session management
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Security flags
    is_suspicious BOOLEAN DEFAULT FALSE,
    flagged_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at);
CREATE INDEX idx_user_sessions_role ON user_sessions(login_role);

-- =====================================================
-- 7. EMAIL VERIFICATIONS
-- =====================================================
CREATE TABLE email_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    verification_code VARCHAR(10) NOT NULL,
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    
    -- Expiration and attempts
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    
    -- Request context
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. PASSWORD RESETS
-- =====================================================
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Reset tokens
    reset_token VARCHAR(255) UNIQUE NOT NULL,
    reset_code VARCHAR(10) NOT NULL,
    
    -- Status
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    
    -- Expiration
    expires_at TIMESTAMP NOT NULL,
    
    -- Request context
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FUNCTIONS AND PROCEDURES
-- =====================================================

-- Function to create user with default buyer role
CREATE OR REPLACE FUNCTION create_user_with_buyer_role(
    p_username VARCHAR(50),
    p_email VARCHAR(255),
    p_phone VARCHAR(20),
    p_password_hash VARCHAR(255)
)
RETURNS INTEGER AS $$
DECLARE
    v_user_id INTEGER;
    v_buyer_role_id INTEGER;
    v_verification_code VARCHAR(10);
BEGIN
    -- Generate verification code
    v_verification_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Insert user
    INSERT INTO users (username, email, phone, password_hash, verification_code, verification_expires)
    VALUES (p_username, p_email, p_phone, p_password_hash, v_verification_code, NOW() + INTERVAL '24 hours')
    RETURNING id INTO v_user_id;
    
    -- Get buyer role ID
    SELECT id INTO v_buyer_role_id FROM roles WHERE role_name = 'buyer';
    
    -- Assign buyer role (default for all new users)
    INSERT INTO user_roles (user_id, role_id, is_primary, role_status)
    VALUES (v_user_id, v_buyer_role_id, TRUE, 'active');
    
    -- Create buyer profile
    INSERT INTO buyer_profiles (user_id) VALUES (v_user_id);
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to apply for seller role
CREATE OR REPLACE FUNCTION apply_for_seller_role(
    p_user_id INTEGER,
    p_business_name VARCHAR(255) DEFAULT NULL,
    p_business_type VARCHAR(50) DEFAULT 'individual'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_seller_role_id INTEGER;
    v_role_exists BOOLEAN;
BEGIN
    -- Get seller role ID
    SELECT id INTO v_seller_role_id FROM roles WHERE role_name = 'seller';
    
    -- Check if user already has seller role
    SELECT EXISTS(
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id AND role_id = v_seller_role_id
    ) INTO v_role_exists;
    
    IF v_role_exists THEN
        RETURN FALSE; -- Already has seller role
    END IF;
    
    -- Add seller role (pending approval)
    INSERT INTO user_roles (user_id, role_id, is_primary, role_status)
    VALUES (p_user_id, v_seller_role_id, FALSE, 'pending');
    
    -- Create seller profile
    INSERT INTO seller_profiles (user_id, business_name, business_type, verification_status)
    VALUES (p_user_id, p_business_name, p_business_type, 'pending');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user roles for login
CREATE OR REPLACE FUNCTION get_user_login_roles(p_user_id INTEGER)
RETURNS TABLE(
    role_name VARCHAR(50),
    role_display_name VARCHAR(100),
    is_primary BOOLEAN,
    role_status VARCHAR(20),
    can_login BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.role_name,
        r.display_name,
        ur.is_primary,
        ur.role_status,
        r.can_login
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id 
    AND ur.is_active = TRUE 
    AND ur.role_status = 'active'
    AND r.is_active = TRUE
    ORDER BY ur.is_primary DESC, r.id ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to log user login
CREATE OR REPLACE FUNCTION log_user_login(
    p_user_id INTEGER,
    p_login_role VARCHAR(50),
    p_session_token VARCHAR(255),
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update user's last login info
    UPDATE users 
    SET 
        last_login_at = NOW(),
        last_login_ip = p_ip_address,
        last_login_role = p_login_role,
        failed_login_attempts = 0
    WHERE id = p_user_id;
    
    -- Create session record
    INSERT INTO user_sessions (
        user_id, session_token, login_role, ip_address, user_agent, 
        expires_at
    ) VALUES (
        p_user_id, p_session_token, p_login_role, p_ip_address, p_user_agent,
        NOW() + INTERVAL '30 days'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON user_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyer_profiles_updated_at 
    BEFORE UPDATE ON buyer_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_profiles_updated_at 
    BEFORE UPDATE ON seller_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Create sample users using the function
SELECT create_user_with_buyer_role(
    'testbuyer1',
    'buyer@example.com',
    '+254700000001',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' -- password: password
);

SELECT create_user_with_buyer_role(
    'testseller1',
    'seller@example.com',
    '+254700000002',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' -- password: password
);

-- Apply for seller role for the second user
SELECT apply_for_seller_role(
    (SELECT id FROM users WHERE username = 'testseller1'),
    'Test Motors Ltd',
    'dealer'
);

-- Approve the seller role
UPDATE user_roles 
SET role_status = 'active', approved_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE username = 'testseller1')
AND role_id = (SELECT id FROM roles WHERE role_name = 'seller');

-- Update seller profile verification
UPDATE seller_profiles 
SET verification_status = 'verified', verified_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE username = 'testseller1');

-- =====================================================
-- VIEWS FOR EASY QUERYING
-- =====================================================

-- User overview with roles
CREATE OR REPLACE VIEW user_overview AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.phone,
    u.status,
    u.is_verified,
    u.last_login_at,
    u.last_login_role,
    ARRAY_AGG(r.role_name ORDER BY ur.is_primary DESC) as roles,
    ARRAY_AGG(ur.role_status ORDER BY ur.is_primary DESC) as role_statuses,
    u.created_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
GROUP BY u.id
ORDER BY u.created_at DESC;

-- Active sessions view
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
    s.id,
    s.user_id,
    u.username,
    s.login_role,
    s.ip_address,
    s.device_type,
    s.browser,
    s.last_activity,
    s.expires_at,
    s.created_at
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.is_active = TRUE AND s.expires_at > NOW()
ORDER BY s.last_activity DESC;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'Main users table with unified signup using username';
COMMENT ON TABLE user_roles IS 'Many-to-many relationship between users and roles with approval workflow';
COMMENT ON TABLE buyer_profiles IS 'Extended profile information for users with buyer role';
COMMENT ON TABLE seller_profiles IS 'Extended profile information for users with seller role';
COMMENT ON TABLE user_sessions IS 'User login sessions with role tracking';

COMMENT ON FUNCTION create_user_with_buyer_role IS 'Creates new user with default buyer role and profile';
COMMENT ON FUNCTION apply_for_seller_role IS 'Allows user to apply for seller role';
COMMENT ON FUNCTION get_user_login_roles IS 'Returns available roles for user login';
COMMENT ON FUNCTION log_user_login IS 'Logs user login with role selection';

-- =====================================================
-- UNIFIED SIGNUP SCHEMA COMPLETE
-- =====================================================
