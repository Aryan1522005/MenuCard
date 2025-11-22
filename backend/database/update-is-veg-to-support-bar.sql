-- Update is_veg column to support bar/cocktail items (value 2)
-- Change from BOOLEAN to TINYINT to support: 0 = non-veg, 1 = veg, 2 = bar/cocktail

-- For MySQL/MariaDB
ALTER TABLE menu_items 
MODIFY COLUMN is_veg TINYINT DEFAULT NULL COMMENT '0=non-veg, 1=veg, 2=bar/cocktail, NULL=not specified';

-- For PostgreSQL (if using PostgreSQL)
-- ALTER TABLE menu_items 
-- ALTER COLUMN is_veg TYPE SMALLINT USING 
--   CASE 
--     WHEN is_veg IS NULL THEN NULL
--     WHEN is_veg = true THEN 1
--     WHEN is_veg = false THEN 0
--     ELSE is_veg::SMALLINT
--   END;

-- Verify the change
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'menu_items'
AND COLUMN_NAME = 'is_veg';


