-- Add image_url column to categories table if it doesn't exist
USE qr_menu_system;

-- Add image_url column
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) AFTER description;


