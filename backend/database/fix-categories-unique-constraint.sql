-- Fix categories unique constraint to be per-restaurant
-- Run this in Neon SQL Editor

-- First, check if restaurant_id exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'restaurant_id'
    ) THEN
        -- Add restaurant_id column
        ALTER TABLE categories ADD COLUMN restaurant_id INTEGER;
        
        -- Set default restaurant_id for existing categories
        UPDATE categories 
        SET restaurant_id = (SELECT id FROM restaurants LIMIT 1) 
        WHERE restaurant_id IS NULL;
        
        -- Make restaurant_id NOT NULL
        ALTER TABLE categories ALTER COLUMN restaurant_id SET NOT NULL;
        
        -- Add foreign key
        ALTER TABLE categories 
        ADD CONSTRAINT fk_category_restaurant 
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Remove ANY existing unique constraints or indexes on 'name' alone
DO $$ 
DECLARE
    r record;
BEGIN
    -- Find and drop constraints
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'categories'::regclass 
        AND conname LIKE '%name%'
    ) LOOP
        EXECUTE 'ALTER TABLE categories DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
    
    -- Drop indexes
    FOR r IN (
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'categories' 
        AND indexname LIKE '%name%'
    ) LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname);
    END LOOP;
END $$;

-- Add restaurant_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE categories ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Now create the correct unique constraint on (restaurant_id, name)
CREATE UNIQUE INDEX IF NOT EXISTS unique_restaurant_category 
ON categories(restaurant_id, name);

SELECT '✅ Migration completed! Categories are now unique per restaurant.' as message;

