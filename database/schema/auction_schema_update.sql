-- =====================================================
-- Auction Schema Update: Fix Condition Check Constraints
-- =====================================================

-- Update vehicles table condition check constraint to allow more values
ALTER TABLE vehicles
DROP CONSTRAINT vehicles_condition_check;

ALTER TABLE vehicles
ADD CONSTRAINT vehicles_condition_check
CHECK (condition IN ('new', 'excellent', 'very-good', 'good', 'fair', 'poor', 'salvage', 'damaged'));

-- Update electronics table condition check constraint to allow more values
ALTER TABLE electronics
DROP CONSTRAINT electronics_condition_check;

ALTER TABLE electronics
ADD CONSTRAINT electronics_condition_check
CHECK (condition IN ('new', 'open_box', 'brand-new', 'like-new', 'excellent', 'very-good', 'good', 'fair', 'poor', 'for-parts', 'damaged'));

-- =====================================================
-- UPDATE COMPLETE
-- =====================================================