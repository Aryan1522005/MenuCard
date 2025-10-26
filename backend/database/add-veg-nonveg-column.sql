-- Add is_veg column to menu_items table
-- This column indicates whether a dish is vegetarian (1) or non-vegetarian (0)
-- Default is NULL to maintain compatibility with existing data

USE qr_menu_system;

-- Add the is_veg column
ALTER TABLE menu_items 
ADD COLUMN is_veg BOOLEAN DEFAULT NULL COMMENT 'NULL=not specified, 1=vegetarian, 0=non-vegetarian';

-- Add an index for filtering by veg/non-veg
ALTER TABLE menu_items
ADD INDEX idx_is_veg (is_veg);

