-- Script to delete all restaurants and menu items and reset auto-increment IDs
-- WARNING: This will delete ALL data in the database!

USE qr_menu_system;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Delete all menu items first
DELETE FROM menu_items;

-- Delete all restaurants
DELETE FROM restaurants;

-- Delete all categories
DELETE FROM categories;

-- Reset auto-increment counters to 1
ALTER TABLE restaurants AUTO_INCREMENT = 1;
ALTER TABLE menu_items AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Show confirmation
SELECT 'All data deleted and auto-increment counters reset to 1' AS status;

