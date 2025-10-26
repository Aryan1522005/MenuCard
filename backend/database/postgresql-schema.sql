-- Digital QR Menu System Database Schema for PostgreSQL (Neon)
-- This script creates the complete database schema for PostgreSQL

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    description TEXT,
    address TEXT,
    phone VARCHAR(50),
    wifi_name VARCHAR(100),
    wifi_password VARCHAR(100),
    custom_sections JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    category_id INTEGER,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    availability_time VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    item_code INTEGER DEFAULT 0,
    is_veg BOOLEAN DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Users table for admin user management
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'viewer')),
    email VARCHAR(100),
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    phone_number VARCHAR(15),
    food_quality INTEGER NOT NULL CHECK (food_quality >= 1 AND food_quality <= 5),
    service INTEGER NOT NULL CHECK (service >= 1 AND service <= 5),
    ambiance INTEGER NOT NULL CHECK (ambiance >= 1 AND ambiance <= 5),
    pricing INTEGER NOT NULL CHECK (pricing >= 1 AND pricing <= 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_category ON menu_items(restaurant_id, category);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_available ON menu_items(restaurant_id, is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_item_code ON menu_items(restaurant_id, item_code);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_veg ON menu_items(is_veg);
CREATE INDEX IF NOT EXISTS idx_feedback_restaurant_created ON feedback(restaurant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_phone_number ON feedback(phone_number);

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
INSERT INTO restaurants (name, slug, logo_url, description) VALUES 
('Café Aroma', 'cafe-aroma', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop&crop=center', 'A cozy coffee shop serving artisanal beverages and fresh pastries')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (restaurant_id, category_id, category, name, description, price, image_url, availability_time, sort_order) VALUES 
-- Beverages
(1, 1, 'Beverages', 'Espresso', 'Rich, full-bodied coffee with a perfect crema', 3.50, 'https://images.unsplash.com/photo-1510591509098-f4fdc6b0a08e?w=300&h=200&fit=crop&crop=center', '06:00 - 18:00', 1),
(1, 1, 'Beverages', 'Cappuccino', 'Espresso with steamed milk and foam', 4.25, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop&crop=center', '06:00 - 18:00', 2),
(1, 1, 'Beverages', 'Café Latte', 'Smooth espresso with steamed milk', 4.75, 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=300&h=200&fit=crop&crop=center', '06:00 - 18:00', 3),
(1, 1, 'Beverages', 'Americano', 'Espresso with hot water', 3.75, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop&crop=center', '06:00 - 18:00', 4),

-- Pastries
(1, 2, 'Pastries', 'Butter Croissant', 'Flaky, buttery pastry baked fresh daily', 3.25, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop&crop=center', '07:00 - 15:00', 1),
(1, 2, 'Pastries', 'Blueberry Muffin', 'Moist muffin packed with fresh blueberries', 3.75, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop&crop=center', '07:00 - 15:00', 2),
(1, 2, 'Pastries', 'Cranberry Scone', 'Traditional scone with dried cranberries', 3.50, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop&crop=center', '07:00 - 15:00', 3),

-- Sandwiches
(1, 3, 'Sandwiches', 'Avocado Toast', 'Smashed avocado on sourdough with cherry tomatoes', 8.50, 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=300&h=200&fit=crop&crop=center', '08:00 - 16:00', 1),
(1, 3, 'Sandwiches', 'Turkey & Swiss', 'Sliced turkey with Swiss cheese, lettuce, and tomato', 9.25, 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=300&h=200&fit=crop&crop=center', '08:00 - 16:00', 2),
(1, 3, 'Sandwiches', 'Grilled Cheese', 'Three-cheese blend on artisan bread', 7.75, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop&crop=center', '08:00 - 16:00', 3)
ON CONFLICT DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, role, full_name, email) VALUES 
('admin', '$2b$10$rQZ8K9vL2nM3oP4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', 'admin', 'System Administrator', 'admin@restaurant.com')
ON CONFLICT (username) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
