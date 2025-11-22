-- Query to see ALL items that will display the amber martini glass icon
-- These are all items in categories where menu_type = 'bar'

-- First, show all bar categories
SELECT 
    c.id AS category_id,
    c.name AS category_name,
    c.menu_type,
    r.name AS restaurant_name,
    COUNT(mi.id) AS item_count
FROM categories c
LEFT JOIN restaurants r ON c.restaurant_id = r.id
LEFT JOIN menu_items mi ON mi.category = c.name AND mi.restaurant_id = c.restaurant_id
WHERE c.menu_type = 'bar'
GROUP BY c.id, c.name, c.menu_type, r.name
ORDER BY r.name, c.name;

-- Show all individual items in bar categories (these will have the martini glass icon)
SELECT 
    r.name AS restaurant_name,
    c.name AS category_name,
    mi.name AS item_name,
    mi.price,
    mi.is_veg AS original_veg_value,
    'Will show AMBER MARTINI GLASS icon 🍸' AS icon_display
FROM menu_items mi
JOIN categories c ON mi.category = c.name AND mi.restaurant_id = c.restaurant_id
JOIN restaurants r ON mi.restaurant_id = r.id
WHERE c.menu_type = 'bar'
ORDER BY r.name, c.name, mi.name;

-- Count total items that will show the martini glass icon
SELECT 
    COUNT(*) AS total_bar_items,
    COUNT(DISTINCT c.id) AS total_bar_categories,
    COUNT(DISTINCT r.id) AS restaurants_with_bar
FROM menu_items mi
JOIN categories c ON mi.category = c.name AND mi.restaurant_id = c.restaurant_id
JOIN restaurants r ON mi.restaurant_id = r.id
WHERE c.menu_type = 'bar';

-- Show comparison: Food items vs Bar items
SELECT 
    c.menu_type,
    COUNT(DISTINCT c.id) AS category_count,
    COUNT(mi.id) AS item_count
FROM categories c
LEFT JOIN menu_items mi ON mi.category = c.name AND mi.restaurant_id = c.restaurant_id
GROUP BY c.menu_type
ORDER BY c.menu_type;


