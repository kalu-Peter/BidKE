-- USERS & ROLES
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'email_verified', 'approved', 'suspended', 'banned')),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(10),
    verification_expires TIMESTAMP,
    verified_at TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(20) UNIQUE NOT NULL CHECK (role_name IN ('buyer','seller','admin'))
);

CREATE TABLE user_roles (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- BUYER PROFILE
CREATE TABLE buyer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    national_id VARCHAR(50),
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Kenya',
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SELLER PROFILE
CREATE TABLE seller_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    contact_name VARCHAR(100),
    company_name VARCHAR(200),
    business_type VARCHAR(50),
    registration_number VARCHAR(100),
    kra_pin VARCHAR(20),
    physical_address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Kenya',
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AUCTIONS
CREATE TABLE auctions (
    id SERIAL PRIMARY KEY,
    seller_id INT REFERENCES users(id),
    category_id INT REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    starting_price DECIMAL(12,2) NOT NULL,
    reserve_price DECIMAL(12,2),
    current_bid DECIMAL(12,2) DEFAULT 0,
    bid_increment DECIMAL(12,2) DEFAULT 1000,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','active','ended','cancelled')),
    featured BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    bid_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auction_images (
    id SERIAL PRIMARY KEY,
    auction_id INT REFERENCES auctions(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BIDS
CREATE TABLE bids (
    id SERIAL PRIMARY KEY,
    auction_id INT REFERENCES auctions(id) ON DELETE CASCADE,
    bidder_id INT REFERENCES users(id),
    amount DECIMAL(12,2) NOT NULL,
    is_auto_bid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AUCTION WINNERS
CREATE TABLE auction_winners (
    id SERIAL PRIMARY KEY,
    auction_id INT UNIQUE REFERENCES auctions(id) ON DELETE CASCADE,
    winner_id INT REFERENCES users(id),
    winning_bid DECIMAL(12,2) NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TRANSACTIONS (escrow/payments)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    auction_id INT REFERENCES auctions(id),
    buyer_id INT REFERENCES users(id),
    seller_id INT REFERENCES users(id),
    amount DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WATCHLIST
CREATE TABLE watchlist (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    auction_id INT REFERENCES auctions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, auction_id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ACTIVITY LOGS
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AUTH SUPPORT
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE verification_codes (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email','phone','password_reset')),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TRIGGERS (update updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON buyer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seller_profiles_updated_at BEFORE UPDATE ON seller_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON auctions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
