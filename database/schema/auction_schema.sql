-- =====================================================
-- BidKE Auction Schema
-- Tables for auction functionality
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS auction_images CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS watchlists CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS electronics CASCADE;
DROP TABLE IF EXISTS auctions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- =====================================================
-- 1. CATEGORIES TABLE
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

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
('Cars', 'cars', 'Automobiles and vehicles'),
('Motorcycles', 'motorcycles', 'Motorcycles and scooters'),
('Electronics', 'electronics', 'Electronic devices and gadgets');

-- =====================================================
-- 2. AUCTIONS TABLE
-- =====================================================
CREATE TABLE auctions (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL, -- References users(id) but we'll add FK later
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,

    -- Basic auction info
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    starting_price DECIMAL(15,2) NOT NULL CHECK (starting_price > 0),
    reserve_price DECIMAL(15,2) NULL CHECK (reserve_price > 0),
    bid_increment DECIMAL(10,2) DEFAULT 1000.00 CHECK (bid_increment > 0),

    -- Timing
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Status and tracking
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'ended', 'cancelled', 'sold')),
    current_price DECIMAL(15,2) NULL,
    current_bidder_id INTEGER NULL,
    total_bids INTEGER DEFAULT 0,
    total_watchers INTEGER DEFAULT 0,

    -- Auction settings
    allow_auto_bidding BOOLEAN DEFAULT TRUE,
    minimum_bid_increment DECIMAL(10,2) DEFAULT 100.00,
    reserve_met BOOLEAN DEFAULT FALSE,

    -- Location and shipping
    location VARCHAR(255),
    shipping_available BOOLEAN DEFAULT TRUE,
    shipping_cost DECIMAL(10,2) NULL,

    -- Metadata
    featured BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,
    tags TEXT[],

    -- Constraints
    CHECK (end_time > start_time),
    CHECK (reserve_price IS NULL OR reserve_price >= starting_price)
);

-- Create indexes for auctions
CREATE INDEX idx_auctions_seller_id ON auctions(seller_id);
CREATE INDEX idx_auctions_category_id ON auctions(category_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_start_time ON auctions(start_time);
CREATE INDEX idx_auctions_end_time ON auctions(end_time);
CREATE INDEX idx_auctions_current_price ON auctions(current_price);
CREATE INDEX idx_auctions_featured ON auctions(featured, priority DESC);

-- =====================================================
-- 3. VEHICLES TABLE
-- =====================================================
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE UNIQUE,

    -- Vehicle details
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle', 'truck', 'van', 'bus', 'other')),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    mileage INTEGER NULL CHECK (mileage >= 0),
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('new', 'excellent', 'very-good', 'good', 'fair', 'poor', 'salvage', 'damaged')),

    -- Vehicle specifics
    registration_number VARCHAR(50) UNIQUE,
    engine_capacity VARCHAR(50),
    fuel_type VARCHAR(20) CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'other')),
    transmission VARCHAR(20) CHECK (transmission IN ('manual', 'automatic', 'cvt', 'other')),
    color VARCHAR(50),
    body_type VARCHAR(50),
    doors INTEGER CHECK (doors >= 2 AND doors <= 5),
    seats INTEGER CHECK (seats >= 1 AND seats <= 50),

    -- Additional details
    vin VARCHAR(50) UNIQUE,
    engine_number VARCHAR(50),
    chassis_number VARCHAR(50),
    location VARCHAR(255),
    features TEXT[], -- Array of features like 'air conditioning', 'power steering', etc.

    -- Documentation
    registration_document_url VARCHAR(500),
    insurance_document_url VARCHAR(500),
    inspection_report_url VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for vehicles
CREATE INDEX idx_vehicles_auction_id ON vehicles(auction_id);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicles_year ON vehicles(year);
CREATE INDEX idx_vehicles_condition ON vehicles(condition);

-- =====================================================
-- 4. ELECTRONICS TABLE
-- =====================================================
CREATE TABLE electronics (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE UNIQUE,

    -- Electronics details
    category VARCHAR(100) NOT NULL, -- 'phone', 'computer', 'tv', 'camera', etc.
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('new', 'open_box', 'brand-new', 'like-new', 'excellent', 'very-good', 'good', 'fair', 'poor', 'for-parts', 'damaged')),

    -- Specifications (stored as JSON)
    specs JSONB,

    -- Additional details
    serial_number VARCHAR(100) UNIQUE,
    warranty BOOLEAN DEFAULT FALSE,
    warranty_period VARCHAR(50), -- '1 year', '2 years', etc.
    warranty_provider VARCHAR(100),
    location VARCHAR(255),

    -- Accessories and documentation
    includes_accessories TEXT[], -- Array of included accessories
    original_box BOOLEAN DEFAULT FALSE,
    receipt_available BOOLEAN DEFAULT FALSE,
    manual_available BOOLEAN DEFAULT FALSE,

    -- Documentation
    warranty_document_url VARCHAR(500),
    receipt_url VARCHAR(500),
    specifications_url VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for electronics
CREATE INDEX idx_electronics_auction_id ON electronics(auction_id);
CREATE INDEX idx_electronics_brand_model ON electronics(brand, model);
CREATE INDEX idx_electronics_category ON electronics(category);
CREATE INDEX idx_electronics_condition ON electronics(condition);

-- =====================================================
-- 5. AUCTION IMAGES TABLE
-- =====================================================
CREATE TABLE auction_images (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,

    -- Image details
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    caption TEXT,

    -- Image metadata
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    image_type VARCHAR(20) DEFAULT 'photo' CHECK (image_type IN ('photo', 'diagram', 'document')),

    -- File information
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),

    -- Upload tracking
    uploaded_by INTEGER NOT NULL, -- References users(id)
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for auction images
CREATE INDEX idx_auction_images_auction_id ON auction_images(auction_id);
CREATE INDEX idx_auction_images_primary ON auction_images(auction_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_auction_images_sort_order ON auction_images(auction_id, sort_order);

-- =====================================================
-- 6. BIDS TABLE
-- =====================================================
CREATE TABLE bids (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
    bidder_id INTEGER NOT NULL, -- References users(id)

    -- Bid details
    bid_amount DECIMAL(15,2) NOT NULL CHECK (bid_amount > 0),
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_auto_bid BOOLEAN DEFAULT FALSE,

    -- Bid status
    bid_status VARCHAR(20) DEFAULT 'active' CHECK (bid_status IN ('active', 'outbid', 'winning', 'won', 'cancelled')),

    -- Maximum bid for auto-bidding
    max_bid DECIMAL(15,2) NULL CHECK (max_bid IS NULL OR max_bid >= bid_amount),

    -- Bid metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    bid_source VARCHAR(20) DEFAULT 'web' CHECK (bid_source IN ('web', 'mobile', 'api')),

    -- Constraints
    UNIQUE(auction_id, bidder_id, bid_time), -- Prevent duplicate bids at same time

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for bids
CREATE INDEX idx_bids_auction_id ON bids(auction_id);
CREATE INDEX idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX idx_bids_bid_amount ON bids(auction_id, bid_amount DESC);
CREATE INDEX idx_bids_bid_time ON bids(auction_id, bid_time DESC);
CREATE INDEX idx_bids_status ON bids(bid_status);

-- =====================================================
-- 7. WATCHLISTS TABLE
-- =====================================================
CREATE TABLE watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- References users(id)
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,

    -- Watchlist details
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notification_enabled BOOLEAN DEFAULT TRUE,

    -- Constraints
    UNIQUE(user_id, auction_id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for watchlists
CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX idx_watchlists_auction_id ON watchlists(auction_id);

-- =====================================================
-- FUNCTIONS AND PROCEDURES
-- =====================================================

-- Function to place a bid
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
    -- Get auction details
    SELECT current_price, starting_price, bid_increment, status, end_time
    INTO v_current_price, v_starting_price, v_bid_increment, v_auction_status, v_auction_end_time
    FROM auctions
    WHERE id = p_auction_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    -- Check if auction is active
    IF v_auction_status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not active');
    END IF;

    -- Check if auction has ended
    IF v_auction_end_time <= NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction has ended');
    END IF;

    -- Calculate minimum bid
    v_minimum_bid := COALESCE(v_current_price, v_starting_price) + v_bid_increment;

    -- Validate bid amount
    IF p_bid_amount < v_minimum_bid THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bid amount too low. Minimum bid: ' || v_minimum_bid);
    END IF;

    -- Check for existing bid from this user
    SELECT id INTO v_existing_bid_id
    FROM bids
    WHERE auction_id = p_auction_id AND bidder_id = p_bidder_id AND bid_status = 'active'
    ORDER BY bid_time DESC
    LIMIT 1;

    -- Insert new bid
    INSERT INTO bids (auction_id, bidder_id, bid_amount, is_auto_bid, max_bid)
    VALUES (p_auction_id, p_bidder_id, p_bid_amount, p_is_auto_bid, p_max_bid);

    -- Update auction current price and bidder
    UPDATE auctions
    SET current_price = p_bid_amount,
        current_bidder_id = p_bidder_id,
        total_bids = total_bids + 1,
        updated_at = NOW()
    WHERE id = p_auction_id;

    -- Mark previous bids as outbid
    UPDATE bids
    SET bid_status = 'outbid'
    WHERE auction_id = p_auction_id
    AND bidder_id != p_bidder_id
    AND bid_status = 'active';

    -- Mark this bid as winning
    UPDATE bids
    SET bid_status = 'winning'
    WHERE id = currval('bids_id_seq');

    RETURN jsonb_build_object('success', true, 'bid_id', currval('bids_id_seq'), 'message', 'Bid placed successfully');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$func$ LANGUAGE plpgsql;

-- Function to get auction details with item info
CREATE OR REPLACE FUNCTION get_auction_details(p_auction_id INTEGER)
RETURNS JSONB AS
$func$
DECLARE
    v_auction_record RECORD;
    v_item_record RECORD;
    v_images JSONB;
    v_result JSONB;
BEGIN
    -- Get auction basic info
    SELECT * INTO v_auction_record
    FROM auctions
    WHERE id = p_auction_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    -- Get item-specific info
    IF EXISTS (SELECT 1 FROM vehicles WHERE auction_id = p_auction_id) THEN
        SELECT * INTO v_item_record FROM vehicles WHERE auction_id = p_auction_id;
        v_result := jsonb_build_object('item_type', 'vehicle', 'item_data', row_to_json(v_item_record));
    ELSIF EXISTS (SELECT 1 FROM electronics WHERE auction_id = p_auction_id) THEN
        SELECT * INTO v_item_record FROM electronics WHERE auction_id = p_auction_id;
        v_result := jsonb_build_object('item_type', 'electronics', 'item_data', row_to_json(v_item_record));
    ELSE
        v_result := jsonb_build_object('item_type', 'unknown');
    END IF;

    -- Get images
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

    -- Combine all data
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

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamp trigger function (reuse from user schema)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_auctions_updated_at
    BEFORE UPDATE ON auctions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_electronics_updated_at
    BEFORE UPDATE ON electronics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR EASY QUERYING
-- =====================================================

-- Active auctions view
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

-- Auction summary view
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

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE auctions IS 'Main auctions table containing all auction listings';
COMMENT ON TABLE vehicles IS 'Vehicle-specific details for vehicle auctions';
COMMENT ON TABLE electronics IS 'Electronics-specific details for electronics auctions';
COMMENT ON TABLE auction_images IS 'Images associated with auctions';
COMMENT ON TABLE bids IS 'All bids placed on auctions';
COMMENT ON TABLE watchlists IS 'User watchlists for tracking auctions';
COMMENT ON TABLE categories IS 'Auction categories (cars, electronics, etc.)';

COMMENT ON FUNCTION place_bid IS 'Places a bid on an auction with validation';
COMMENT ON FUNCTION get_auction_details IS 'Returns complete auction details including item specifics and images';

-- =====================================================
-- AUCTION SCHEMA COMPLETE
-- =====================================================