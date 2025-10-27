-- Increase image URL field sizes for PostgreSQL
-- This script increases the character limit for image URLs in restaurants, categories, and menu_items tables
-- Changing from VARCHAR(500) to TEXT to support very long URLs

-- Update logo_url in restaurants table
ALTER TABLE restaurants 
ALTER COLUMN logo_url TYPE TEXT;

-- Update image_url in categories table
ALTER TABLE categories 
ALTER COLUMN image_url TYPE TEXT;

-- Update image_url in menu_items table
ALTER TABLE menu_items 
ALTER COLUMN image_url TYPE TEXT;

-- Confirm the changes
SELECT 
    'Image URL fields have been updated to TEXT type to support longer URLs' AS status;

