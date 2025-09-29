-- =====================================================
-- Unified schema generated from PHP model files (users + auctions + profiles)
-- This file combines the unified signup schema and auction schema and ensures
-- foreign keys align with model expectations (e.g., auctions.seller_id -> users.id).
-- =====================================================

-- Drop auction-related tables first to avoid FK conflicts
DROP TABLE IF EXISTS auction_images CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS watchlists CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS electronics CASCADE;
DROP TABLE IF EXISTS auctions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Then drop user-related tables
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS seller_profiles CASCADE;
DROP TABLE IF EXISTS buyer_profiles CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- =====================================================
-- ROLES TABLE
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

INSERT INTO roles (role_name, display_name, description) VALUES
('buyer', 'Buyer', 'Can browse and bid on auction items'),
('seller', 'Seller', 'Can list items for auction and manage sales'),
('admin', 'Administrator', 'System administration and management');

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'inactive', 'banned')),
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    phone_verified_at TIMESTAMP NULL,
    verification_code VARCHAR(10),
    verification_expires TIMESTAMP,
    phone_verification_code VARCHAR(6),
    phone_verification_expires TIMESTAMP,
    avatar_url VARCHAR(500),
    full_name VARCHAR(255),
    bio TEXT,
    date_of_birth DATE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Kenya',
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    last_login_role VARCHAR(50),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_verification_code ON users(verification_code);
CREATE INDEX idx_users_phone_verification_code ON users(phone_verification_code);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- USER ROLES
-- =====================================================
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    approved_by INTEGER REFERENCES users(id) NULL,
    role_status VARCHAR(20) DEFAULT 'active' CHECK (role_status IN ('pending', 'active', 'suspended', 'rejected')),
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_primary ON user_roles(user_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_user_roles_active ON user_roles(user_id, is_active) WHERE is_active = TRUE;

-- =====================================================
-- BUYER PROFILES
-- =====================================================
CREATE TABLE buyer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    national_id VARCHAR(50) UNIQUE,
    national_id_verified BOOLEAN DEFAULT FALSE,
    kyc_documents JSONB DEFAULT '[]'::jsonb,
    kyc_type VARCHAR(50),
    preferred_categories TEXT[],
    max_bid_limit DECIMAL(15,2) DEFAULT 0,
    auto_bid_enabled BOOLEAN DEFAULT FALSE,
    bid_increment_preference DECIMAL(10,2) DEFAULT 100.00,
    default_shipping_address TEXT,
    shipping_instructions TEXT,
    preferred_delivery_time VARCHAR(50),
    preferred_payment_methods TEXT[],
    total_bids INTEGER DEFAULT 0,
    successful_bids INTEGER DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    average_bid_amount DECIMAL(15,2) DEFAULT 0,
    won_auctions INTEGER DEFAULT 0,
    buyer_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    bid_notifications BOOLEAN DEFAULT TRUE,
    outbid_notifications BOOLEAN DEFAULT TRUE,
    winning_notifications BOOLEAN DEFAULT TRUE,
    auction_ending_notifications BOOLEAN DEFAULT TRUE,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    is_restricted BOOLEAN DEFAULT FALSE,
    restriction_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SELLER PROFILES
-- =====================================================
CREATE TABLE seller_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    business_name VARCHAR(255),
    business_type VARCHAR(50) CHECK (business_type IN (
        'individual', 'sole_proprietorship', 'partnership', 'company', 
        'auctioneer', 'bank', 'microfinance', 'sacco', 'dealer', 
        'leasing_company', 'government', 'ngo', 'other'
    )) DEFAULT 'individual',
    business_registration VARCHAR(100) UNIQUE,
    tax_pin VARCHAR(50) UNIQUE,
    business_permit VARCHAR(100),
    business_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected', 'expired')),
    verification_documents TEXT[],
    verified_at TIMESTAMP,
    verified_by INTEGER REFERENCES users(id),
    verification_notes TEXT,
    business_address TEXT,
    business_phone VARCHAR(20),
    business_email VARCHAR(255),
    website_url VARCHAR(500),
    business_description TEXT,
    operating_hours JSONB,
    service_areas TEXT[],
    specializations TEXT[],
    bank_account_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(255),
    bank_branch VARCHAR(255),
    bank_code VARCHAR(20),
    mobile_money_number VARCHAR(20),
    mobile_money_provider VARCHAR(50),
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    listing_fee DECIMAL(10,2) DEFAULT 0.00,
    auto_renewal BOOLEAN DEFAULT FALSE,
    reserve_price_required BOOLEAN DEFAULT FALSE,
    immediate_payment_required BOOLEAN DEFAULT TRUE,
    total_listings INTEGER DEFAULT 0,
    active_listings INTEGER DEFAULT 0,
    completed_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    average_sale_price DECIMAL(15,2) DEFAULT 0,
    seller_rating DECIMAL(3,2) DEFAULT 0.00,
    total_seller_reviews INTEGER DEFAULT 0,
    response_time_hours DECIMAL(5,2) DEFAULT 24.00,
    fulfillment_rate DECIMAL(5,2) DEFAULT 100.00,
    seller_status VARCHAR(20) DEFAULT 'active' CHECK (seller_status IN ('pending', 'active', 'suspended', 'restricted', 'banned')),
    can_list_auctions BOOLEAN DEFAULT TRUE,
    can_accept_payments BOOLEAN DEFAULT TRUE,
    max_active_listings INTEGER DEFAULT 50,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_expires_at TIMESTAMP,
    featured_listings_remaining INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- USER SESSIONS
-- =====================================================
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    login_role VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    operating_system VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_suspicious BOOLEAN DEFAULT FALSE,
    flagged_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at);
CREATE INDEX idx_user_sessions_role ON user_sessions(login_role);

-- =====================================================
-- EMAIL VERIFICATIONS
-- =====================================================
CREATE TABLE email_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    verification_code VARCHAR(10) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PASSWORD RESETS
-- =====================================================
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reset_token VARCHAR(255) UNIQUE NOT NULL,
    reset_code VARCHAR(10) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FUNCTIONS (create_user_with_buyer_role, etc.)
-- =====================================================
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
    v_verification_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    INSERT INTO users (username, email, phone, password_hash, verification_code, verification_expires)
    VALUES (p_username, p_email, p_phone, p_password_hash, v_verification_code, NOW() + INTERVAL '24 hours')
    RETURNING id INTO v_user_id;
    SELECT id INTO v_buyer_role_id FROM roles WHERE role_name = 'buyer';
    INSERT INTO user_roles (user_id, role_id, is_primary, role_status)
    VALUES (v_user_id, v_buyer_role_id, TRUE, 'active');
    INSERT INTO buyer_profiles (user_id) VALUES (v_user_id);
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

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
    SELECT id INTO v_seller_role_id FROM roles WHERE role_name = 'seller';
    SELECT EXISTS(
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id AND role_id = v_seller_role_id
    ) INTO v_role_exists;
    IF v_role_exists THEN
        RETURN FALSE;
    END IF;
    INSERT INTO user_roles (user_id, role_id, is_primary, role_status)
    VALUES (p_user_id, v_seller_role_id, FALSE, 'pending');
    INSERT INTO seller_profiles (user_id, business_name, business_type, verification_status)
    VALUES (p_user_id, p_business_name, p_business_type, 'pending');
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION log_user_login(
    p_user_id INTEGER,
    p_login_role VARCHAR(50),
    p_session_token VARCHAR(255),
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET 
        last_login_at = NOW(),
        last_login_ip = p_ip_address,
        last_login_role = p_login_role,
        failed_login_attempts = 0
    WHERE id = p_user_id;
    INSERT INTO user_sessions (
        user_id, session_token, login_role, ip_address, user_agent, 
        expires_at
    ) VALUES (
        p_user_id, p_session_token, p_login_role, p_ip_address, p_user_agent,
        NOW() + INTERVAL '30 days'
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers for user-related tables
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
-- AUCTION: CATEGORIES
-- =====================================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, slug, description) VALUES
('Cars', 'cars', 'Automobiles and vehicles'),
('Motorcycles', 'motorcycles', 'Motorcycles and scooters'),
('Electronics', 'electronics', 'Electronic devices and gadgets');

-- =====================================================
-- AUCTIONS TABLE (references users.id)
-- =====================================================
CREATE TABLE auctions (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    starting_price DECIMAL(15,2) NOT NULL CHECK (starting_price > 0),
    reserve_price DECIMAL(15,2) NULL CHECK (reserve_price > 0),
    bid_increment DECIMAL(10,2) DEFAULT 1000.00 CHECK (bid_increment > 0),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'ended', 'cancelled', 'sold')),
    current_price DECIMAL(15,2) NULL,
    current_bidder_id INTEGER NULL,
    total_bids INTEGER DEFAULT 0,
    total_watchers INTEGER DEFAULT 0,
    allow_auto_bidding BOOLEAN DEFAULT TRUE,
    minimum_bid_increment DECIMAL(10,2) DEFAULT 100.00,
    reserve_met BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    shipping_available BOOLEAN DEFAULT TRUE,
    shipping_cost DECIMAL(10,2) NULL,
    featured BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,
    tags TEXT[],
    CHECK (end_time > start_time),
    CHECK (reserve_price IS NULL OR reserve_price >= starting_price)
);

CREATE INDEX idx_auctions_seller_id ON auctions(seller_id);
CREATE INDEX idx_auctions_category_id ON auctions(category_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_start_time ON auctions(start_time);
CREATE INDEX idx_auctions_end_time ON auctions(end_time);
CREATE INDEX idx_auctions_current_price ON auctions(current_price);
CREATE INDEX idx_auctions_featured ON auctions(featured, priority DESC);

-- VEHICLES
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle', 'truck', 'van', 'bus', 'other')),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    mileage INTEGER NULL CHECK (mileage >= 0),
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('new', 'excellent', 'very-good', 'good', 'fair', 'poor', 'salvage', 'damaged')),
    registration_number VARCHAR(50) UNIQUE,
    engine_capacity VARCHAR(50),
    fuel_type VARCHAR(20) CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'other')),
    transmission VARCHAR(20) CHECK (transmission IN ('manual', 'automatic', 'cvt', 'other')),
    color VARCHAR(50),
    body_type VARCHAR(50),
    doors INTEGER CHECK (doors >= 2 AND doors <= 5),
    seats INTEGER CHECK (seats >= 1 AND seats <= 50),
    vin VARCHAR(50) UNIQUE,
    engine_number VARCHAR(50),
    chassis_number VARCHAR(50),
    location VARCHAR(255),
    features TEXT[],
    registration_document_url VARCHAR(500),
    insurance_document_url VARCHAR(500),
    inspection_report_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ELECTRONICS
CREATE TABLE electronics (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE UNIQUE,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('new', 'open_box', 'brand-new', 'like-new', 'excellent', 'very-good', 'good', 'fair', 'poor', 'for-parts', 'damaged')),
    specs JSONB,
    serial_number VARCHAR(100) UNIQUE,
    warranty BOOLEAN DEFAULT FALSE,
    warranty_period VARCHAR(50),
    warranty_provider VARCHAR(100),
    location VARCHAR(255),
    includes_accessories TEXT[],
    original_box BOOLEAN DEFAULT FALSE,
    receipt_available BOOLEAN DEFAULT FALSE,
    manual_available BOOLEAN DEFAULT FALSE,
    warranty_document_url VARCHAR(500),
    receipt_url VARCHAR(500),
    specifications_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AUCTION IMAGES
CREATE TABLE auction_images (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    image_type VARCHAR(20) DEFAULT 'photo' CHECK (image_type IN ('photo', 'diagram', 'document')),
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- BIDS
CREATE TABLE bids (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
    bidder_id INTEGER NOT NULL,
    bid_amount DECIMAL(15,2) NOT NULL CHECK (bid_amount > 0),
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_auto_bid BOOLEAN DEFAULT FALSE,
    bid_status VARCHAR(20) DEFAULT 'active' CHECK (bid_status IN ('active', 'outbid', 'winning', 'won', 'cancelled')),
    max_bid DECIMAL(15,2) NULL CHECK (max_bid IS NULL OR max_bid >= bid_amount),
    ip_address VARCHAR(45),
    user_agent TEXT,
    bid_source VARCHAR(20) DEFAULT 'web' CHECK (bid_source IN ('web', 'mobile', 'api')),
    UNIQUE(auction_id, bidder_id, bid_time),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WATCHLISTS
CREATE TABLE watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notification_enabled BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, auction_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Functions and triggers for auctions
-- Function to place_bid (copied from auction schema)
CREATE OR REPLACE FUNCTION place_bid(
    p_auction_id INTEGER,
    p_bidder_id INTEGER,
    p_bid_amount DECIMAL(15,2),
    p_is_auto_bid BOOLEAN DEFAULT FALSE,
    p_max_bid DECIMAL(15,2) DEFAULT NULL
)
RETURNS JSONB AS
$func$
DECLARE
    v_current_price DECIMAL(15,2);
    v_starting_price DECIMAL(15,2);
    v_bid_increment DECIMAL(10,2);
    v_minimum_bid DECIMAL(15,2);
    v_auction_status VARCHAR(20);
    v_auction_end_time TIMESTAMP;
    v_existing_bid_id INTEGER;
    v_result JSONB;
BEGIN
    SELECT current_price, starting_price, bid_increment, status, end_time
    INTO v_current_price, v_starting_price, v_bid_increment, v_auction_status, v_auction_end_time
    FROM auctions
    WHERE id = p_auction_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;
    IF v_auction_status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not active');
    END IF;
    IF v_auction_end_time <= NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction has ended');
    END IF;
    v_minimum_bid := COALESCE(v_current_price, v_starting_price) + v_bid_increment;
    IF p_bid_amount < v_minimum_bid THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bid amount too low. Minimum bid: ' || v_minimum_bid);
    END IF;
    SELECT id INTO v_existing_bid_id
    FROM bids
    WHERE auction_id = p_auction_id AND bidder_id = p_bidder_id AND bid_status = 'active'
    ORDER BY bid_time DESC
    LIMIT 1;
    INSERT INTO bids (auction_id, bidder_id, bid_amount, is_auto_bid, max_bid)
    VALUES (p_auction_id, p_bidder_id, p_bid_amount, p_is_auto_bid, p_max_bid);
    UPDATE auctions
    SET current_price = p_bid_amount,
        current_bidder_id = p_bidder_id,
        total_bids = total_bids + 1,
        updated_at = NOW()
    WHERE id = p_auction_id;
    UPDATE bids
    SET bid_status = 'outbid'
    WHERE auction_id = p_auction_id
    AND bidder_id != p_bidder_id
    AND bid_status = 'active';
    UPDATE bids
    SET bid_status = 'winning'
    WHERE id = currval('bids_id_seq');
    RETURN jsonb_build_object('success', true, 'bid_id', currval('bids_id_seq'), 'message', 'Bid placed successfully');
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$func$ LANGUAGE plpgsql;

-- get_auction_details function
CREATE OR REPLACE FUNCTION get_auction_details(p_auction_id INTEGER)
RETURNS JSONB AS
$func$
DECLARE
    v_auction_record RECORD;
    v_item_record RECORD;
    v_images JSONB;
    v_result JSONB;
BEGIN
    SELECT * INTO v_auction_record
    FROM auctions
    WHERE id = p_auction_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;
    IF EXISTS (SELECT 1 FROM vehicles WHERE auction_id = p_auction_id) THEN
        SELECT * INTO v_item_record FROM vehicles WHERE auction_id = p_auction_id;
        v_result := jsonb_build_object('item_type', 'vehicle', 'item_data', row_to_json(v_item_record));
    ELSIF EXISTS (SELECT 1 FROM electronics WHERE auction_id = p_auction_id) THEN
        SELECT * INTO v_item_record FROM electronics WHERE auction_id = p_auction_id;
        v_result := jsonb_build_object('item_type', 'electronics', 'item_data', row_to_json(v_item_record));
    ELSE
        v_result := jsonb_build_object('item_type', 'unknown');
    END IF;
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'url', image_url,
            'alt_text', alt_text,
            'is_primary', is_primary,
            'sort_order', sort_order
        ) ORDER BY sort_order, is_primary DESC
    ) INTO v_images
    FROM auction_images
    WHERE auction_id = p_auction_id AND is_active = TRUE;
    RETURN jsonb_build_object(
        'success', true,
        'auction', row_to_json(v_auction_record),
        'item', v_result,
        'images', COALESCE(v_images, '[]'::jsonb)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$func$ LANGUAGE plpgsql;

-- Triggers for auctions
CREATE TRIGGER update_auctions_updated_at
    BEFORE UPDATE ON auctions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_electronics_updated_at
    BEFORE UPDATE ON electronics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views
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

CREATE OR REPLACE VIEW active_auctions AS
SELECT
    a.*,
    c.name as category_name,
    c.slug as category_slug,
    CASE
        WHEN v.auction_id IS NOT NULL THEN 'vehicle'
        WHEN e.auction_id IS NOT NULL THEN 'electronics'
        ELSE 'unknown'
    END as item_type,
    COUNT(b.id) as bid_count,
    COUNT(w.id) as watch_count
FROM auctions a
LEFT JOIN categories c ON a.category_id = c.id
LEFT JOIN vehicles v ON a.id = v.auction_id
LEFT JOIN electronics e ON a.id = e.auction_id
LEFT JOIN bids b ON a.id = b.auction_id AND b.bid_status IN ('active', 'winning')
LEFT JOIN watchlists w ON a.id = w.auction_id
WHERE a.status = 'active'
AND a.start_time <= NOW()
AND a.end_time > NOW()
GROUP BY a.id, c.name, c.slug, v.auction_id, e.auction_id;

CREATE OR REPLACE VIEW auction_summary AS
SELECT
    a.id,
    a.title,
    a.starting_price,
    a.current_price,
    a.reserve_price,
    a.status,
    a.start_time,
    a.end_time,
    a.total_bids,
    c.name as category,
    CASE
        WHEN v.auction_id IS NOT NULL THEN v.make || ' ' || v.model
        WHEN e.auction_id IS NOT NULL THEN e.brand || ' ' || e.model
        ELSE a.title
    END as item_description
FROM auctions a
LEFT JOIN categories c ON a.category_id = c.id
LEFT JOIN vehicles v ON a.id = v.auction_id
LEFT JOIN electronics e ON a.id = e.auction_id;

-- Sample data: create two users and a sample auction for testing
SELECT create_user_with_buyer_role(
    'testbuyer1',
    'buyer@example.com',
    '+254700000001',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
);

SELECT create_user_with_buyer_role(
    'testseller1',
    'seller@example.com',
    '+254700000002',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
);

SELECT apply_for_seller_role(
    (SELECT id FROM users WHERE username = 'testseller1'),
    'Test Motors Ltd',
    'dealer'
);

UPDATE user_roles 
SET role_status = 'active', approved_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE username = 'testseller1')
AND role_id = (SELECT id FROM roles WHERE role_name = 'seller');

UPDATE seller_profiles 
SET verification_status = 'verified', verified_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE username = 'testseller1');

-- =====================================================
-- Unified schema file end
-- =====================================================
