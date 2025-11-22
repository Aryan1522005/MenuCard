-- REVERT: Change all bar menu categories back to food menu
-- This will restore veg/non-veg icons and filter buttons for all categories

-- Option 1: Revert ALL categories to food menu
UPDATE categories 
SET menu_type = 'food';

-- Option 2: Revert only specific drink categories back to food menu
-- Uncomment this if you want to revert only drink categories instead of all
/*
UPDATE categories 
SET menu_type = 'food' 
WHERE LOWER(name) LIKE '%mocktail%' 
   OR LOWER(name) LIKE '%refresher%'
   OR LOWER(name) LIKE '%beverage%'
   OR LOWER(name) LIKE '%drink%'
   OR LOWER(name) LIKE '%juice%'
   OR LOWER(name) LIKE '%smoothie%'
   OR LOWER(name) LIKE '%shake%'
   OR LOWER(name) LIKE '%cocktail%'
   OR LOWER(name) LIKE '%coffee%'
   OR LOWER(name) LIKE '%tea%'
   OR LOWER(name) LIKE '%lassi%'
   OR LOWER(name) LIKE '%soda%'
   OR LOWER(name) LIKE '%water%'
   OR LOWER(name) LIKE '%beer%'
   OR LOWER(name) LIKE '%wine%'
   OR LOWER(name) LIKE '%bar%';
*/

-- Verify all categories are now food menu
SELECT id, name, menu_type, restaurant_id 
FROM categories 
ORDER BY restaurant_id, name;

-- Show count by menu type
SELECT 
    menu_type,
    COUNT(*) AS category_count
FROM categories
GROUP BY menu_type;

