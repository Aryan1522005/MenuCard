-- Add restaurant_id and image_url to categories table for PostgreSQL
-- This makes categories restaurant-specific and allows category images

-- Add restaurant_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'restaurant_id'
    ) THEN
        ALTER TABLE categories ADD COLUMN restaurant_id INTEGER;
        
        -- Update existing categories to belong to the first restaurant (if any)
        UPDATE categories 
        SET restaurant_id = (SELECT id FROM restaurants LIMIT 1) 
        WHERE restaurant_id IS NULL;
        
        -- Add foreign key constraint
        ALTER TABLE categories 
        ADD CONSTRAINT fk_category_restaurant 
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;
        
        -- Make restaurant_id NOT NULL after updating existing data
        ALTER TABLE categories ALTER COLUMN restaurant_id SET NOT NULL;
        
        -- Add unique constraint for restaurant_id + name
        CREATE UNIQUE INDEX IF NOT EXISTS unique_restaurant_category 
        ON categories(restaurant_id, name);
    END IF;
END $$;

-- Add image_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE categories ADD COLUMN image_url TEXT;
    END IF;
END $$;

