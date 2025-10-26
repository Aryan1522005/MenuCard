-- Add item_code column to menu_items table
-- This column will store unique item codes per restaurant starting from 1

USE qr_menu_system;

-- Add item_code column if it doesn't exist
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS item_code INT DEFAULT 0 AFTER sort_order;

-- Add index for faster lookups
ALTER TABLE menu_items 
ADD INDEX IF NOT EXISTS idx_restaurant_item_code (restaurant_id, item_code);

-- Update existing items to have item_codes based on their insertion order
-- For each restaurant, assign sequential item codes
SET @restaurant_id = 0;
SET @item_code = 0;

UPDATE menu_items
SET item_code = (
  SELECT @item_code := IF(@restaurant_id = restaurant_id, @item_code + 1, 1) + 
         IF(@restaurant_id := restaurant_id, 0, 0)
  FROM (SELECT @restaurant_id := 0, @item_code := 0) AS init
)
ORDER BY restaurant_id, id;

