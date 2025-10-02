-- Migration: create auction_winners table
-- Run this against your PostgreSQL DB to create the winners table

CREATE TABLE IF NOT EXISTS auction_winners (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    winner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    winning_bid_id INTEGER NULL REFERENCES bids(id) ON DELETE SET NULL,
    winning_amount DECIMAL(15,2) NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auction_winners_auction_id ON auction_winners(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_winners_winner_id ON auction_winners(winner_id);
