-- Digital QR Menu System Database Schema
-- Run this script to create the database and tables

CREATE DATABASE IF NOT EXISTS qr_menu_system;
USE qr_menu_system;

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_category_name (name)
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    category_id INT,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    availability_time VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    item_code INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_restaurant_category (restaurant_id, category),
    INDEX idx_restaurant_available (restaurant_id, is_available),
    INDEX idx_restaurant_item_code (restaurant_id, item_code)
);

-- Insert sample categories
INSERT INTO categories (name, description, color, sort_order) VALUES 
('Beverages', 'Hot and cold drinks', '#8B4513', 1),
('Pastries', 'Fresh baked goods', '#D2691E', 2),
('Sandwiches', 'Fresh sandwiches and wraps', '#228B22', 3),
('Pizza', 'Wood-fired pizzas', '#FF6347', 4),
('Pasta', 'Italian pasta dishes', '#FFD700', 5),
('Appetizers', 'Starters and small plates', '#9370DB', 6),
('Desserts', 'Sweet treats', '#FF69B4', 7),
('Drinks', 'Non-alcoholic beverages', '#00CED1', 8);

-- Insert sample restaurant
INSERT INTO restaurants (name, slug, logo_url, description) VALUES 
('Café Aroma', 'cafe-aroma', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop&crop=center', 'A cozy coffee shop serving artisanal beverages and fresh pastries');

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
(1, 3, 'Sandwiches', 'Grilled Cheese', 'Three-cheese blend on artisan bread', 7.75, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop&crop=center', '08:00 - 16:00', 3);
