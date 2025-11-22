-- Update ALL bar/drink related categories to be bar menu
-- This includes mocktails, beverages, drinks, juices, smoothies, shakes, etc.
UPDATE categories 
SET menu_type = 'bar' 
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
   OR LOWER(name) LIKE '%liquor%'
   OR LOWER(name) LIKE '%bar%'
   OR LOWER(name) LIKE '%cooler%'
   OR LOWER(name) LIKE '%frappe%'
   OR LOWER(name) LIKE '%milkshake%';

-- Show all categories that were updated
SELECT id, name, menu_type, restaurant_id 
FROM categories 
WHERE menu_type = 'bar'
ORDER BY restaurant_id, name;

-- Show all categories to verify which are food vs bar
SELECT id, name, menu_type, restaurant_id 
FROM categories 
ORDER BY restaurant_id, menu_type, name;

