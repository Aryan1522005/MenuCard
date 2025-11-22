-- Update is_veg column to support bar/cocktail items (value 2)
-- Change from BOOLEAN to SMALLINT to support: 0 = non-veg, 1 = veg, 2 = bar/cocktail
-- For PostgreSQL 17

-- Step 1: Convert BOOLEAN to SMALLINT
-- true -> 1 (vegetarian)
-- false -> 0 (non-vegetarian)
-- NULL -> NULL (not specified)
ALTER TABLE menu_items 
ALTER COLUMN is_veg TYPE SMALLINT USING 
  CASE 
    WHEN is_veg IS NULL THEN NULL
    WHEN is_veg = true THEN 1
    WHEN is_veg = false THEN 0
    ELSE NULL
  END;

-- Step 2: Add a comment to document the values
COMMENT ON COLUMN menu_items.is_veg IS '0=non-veg, 1=veg, 2=bar/cocktail, NULL=not specified';

-- Step 3: Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'menu_items'
AND column_name = 'is_veg';

-- Step 4: Check current data distribution (optional)
SELECT 
    is_veg,
    COUNT(*) as count
FROM menu_items
GROUP BY is_veg
ORDER BY is_veg NULLS LAST;

