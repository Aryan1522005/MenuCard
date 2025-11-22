-- Add menu_type column to categories table
-- This allows categories to be categorized as 'food' or 'bar'
-- Run this in your Neon PostgreSQL database SQL Editor

-- Add menu_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'menu_type'
    ) THEN
        -- Add the column with default value and check constraint
        ALTER TABLE categories 
        ADD COLUMN menu_type VARCHAR(10) DEFAULT 'food' 
        CHECK (menu_type IN ('food', 'bar'));
        
        -- Update existing categories to default to 'food'
        UPDATE categories 
        SET menu_type = 'food' 
        WHERE menu_type IS NULL;
        
        -- Create index for faster filtering by menu_type
        CREATE INDEX IF NOT EXISTS idx_categories_menu_type ON categories(menu_type);
        
        RAISE NOTICE 'menu_type column added successfully';
    ELSE
        RAISE NOTICE 'menu_type column already exists';
    END IF;
END $$;

