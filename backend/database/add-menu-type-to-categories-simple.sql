-- Simple version: Add menu_type column to categories table
-- Copy and paste this entire query into Neon SQL Editor

-- Step 1: Add menu_type column
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS menu_type VARCHAR(10) DEFAULT 'food';

-- Step 2: Add check constraint to ensure only 'food' or 'bar' values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'categories_menu_type_check'
    ) THEN
        ALTER TABLE categories 
        ADD CONSTRAINT categories_menu_type_check 
        CHECK (menu_type IN ('food', 'bar'));
    END IF;
END $$;

-- Step 3: Update existing categories to 'food' if NULL
UPDATE categories 
SET menu_type = 'food' 
WHERE menu_type IS NULL;

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_menu_type ON categories(menu_type);

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'categories' AND column_name = 'menu_type';

