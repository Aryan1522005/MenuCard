-- Insert sample categories
INSERT INTO categories (name, description, color, sort_order) VALUES 
('Beverages', 'Hot and cold drinks', '#8B4513', 1),
('Pastries', 'Fresh baked goods', '#D2691E', 2),
('Sandwiches', 'Fresh sandwiches and wraps', '#228B22', 3),
('Pizza', 'Wood-fired pizzas', '#FF6347', 4),
('Pasta', 'Italian pasta dishes', '#FFD700', 5),
('Appetizers', 'Starters and small plates', '#9370DB', 6),
('Desserts', 'Sweet treats', '#FF69B4', 7),
('Drinks', 'Non-alcoholic beverages', '#00CED1', 8)
ON CONFLICT (name) DO NOTHING;

-- Insert sample restaurant
INSERT INTO restaurants (name, slug, logo_url, description) 
VALUES ('Café Aroma', 'cafe-aroma', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop&crop=center', 'A cozy coffee shop serving artisanal beverages and fresh pastries')
ON CONFLICT (slug) DO NOTHING;

-- Get the restaurant ID
DO $$
DECLARE
    restaurant_id_val INTEGER;
    beverages_id INTEGER;
    pastries_id INTEGER;
    sandwiches_id INTEGER;
BEGIN
    SELECT id INTO restaurant_id_val FROM restaurants WHERE slug = 'cafe-aroma';
    SELECT id INTO beverages_id FROM categories WHERE name = 'Beverages';
    SELECT id INTO pastries_id FROM categories WHERE name = 'Pastries';
    SELECT id INTO sandwiches_id FROM categories WHERE name = 'Sandwiches';

    -- Insert menu items
    INSERT INTO menu_items (restaurant_id, category_id, category, name, description, price, image_url, availability_time, sort_order, item_code, is_veg) VALUES 
    (restaurant_id_val, beverages_id, 'Beverages', 'Espresso', 'Rich, full-bodied coffee with a perfect crema', 3.50, 'https://images.unsplash.com/photo-1510591509098-f4fdc6b0a08e?w=300&h=200&fit=crop&crop=center', '06:00 - 18:00', 1, 1, true),
    (restaurant_id_val, beverages_id, 'Beverages', 'Cappuccino', 'Espresso with steamed milk and foam', 4.25, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop&crop=center', '06:00 - 18:00', 2, 2, true),
    (restaurant_id_val, beverages_id, 'Beverages', 'Café Latte', 'Smooth espresso with steamed milk', 4.75, 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=300&h=200&fit=crop&crop=center', '06:00 - 18:00', 3, 3, true),
    (restaurant_id_val, beverages_id, 'Beverages', 'Americano', 'Espresso with hot water', 3.75, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop&crop=center', '06:00 - 18:00', 4, 4, true),
    (restaurant_id_val, pastries_id, 'Pastries', 'Butter Croissant', 'Flaky, buttery pastry baked fresh daily', 3.25, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop&crop=center', '07:00 - 15:00', 1, 5, true),
    (restaurant_id_val, pastries_id, 'Pastries', 'Blueberry Muffin', 'Moist muffin packed with fresh blueberries', 3.75, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop&crop=center', '07:00 - 15:00', 2, 6, true),
    (restaurant_id_val, pastries_id, 'Pastries', 'Cranberry Scone', 'Traditional scone with dried cranberries', 3.50, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop&crop=center', '07:00 - 15:00', 3, 7, true),
    (restaurant_id_val, sandwiches_id, 'Sandwiches', 'Avocado Toast', 'Smashed avocado on sourdough with cherry tomatoes', 8.50, 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=300&h=200&fit=crop&crop=center', '08:00 - 16:00', 1, 8, true),
    (restaurant_id_val, sandwiches_id, 'Sandwiches', 'Turkey & Swiss', 'Sliced turkey with Swiss cheese, lettuce, and tomato', 9.25, 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=300&h=200&fit=crop&crop=center', '08:00 - 16:00', 2, 9, false),
    (restaurant_id_val, sandwiches_id, 'Sandwiches', 'Grilled Cheese', 'Three-cheese blend on artisan bread', 7.75, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop&crop=center', '08:00 - 16:00', 3, 10, true);
END $$;

SELECT '✅ Sample data inserted successfully!' as message;

