-- Update schema to move images from categories to menu items
USE qr_menu_system;

-- Remove image_url from categories table
ALTER TABLE categories DROP COLUMN image_url;

-- Ensure menu_items has image_url, preparation_time (already exists)
-- Just verify the columns exist
DESCRIBE menu_items;

-- Add per-restaurant sequential item_code
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS item_code INT NULL;
CREATE INDEX IF NOT EXISTS idx_item_code_restaurant ON menu_items (restaurant_id, item_code);

