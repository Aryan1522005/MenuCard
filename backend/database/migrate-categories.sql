-- Migration to add restaurant_id to categories table
-- This makes categories restaurant-specific

USE qr_menu_system;

-- Drop the old unique constraint if it exists
SET @has_index := (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'categories' AND index_name = 'unique_category_name'
);
SET @sql := IF(@has_index > 0, 'ALTER TABLE categories DROP INDEX unique_category_name', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add restaurant_id column
-- Add restaurant_id if it doesn't exist
SET @has_col := (
  SELECT COUNT(1) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'categories' AND column_name = 'restaurant_id'
);
SET @sql := IF(@has_col = 0, 'ALTER TABLE categories ADD COLUMN restaurant_id INT AFTER id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add foreign key constraint
-- Add FK if missing
SET @has_fk := (
  SELECT COUNT(1) FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_category_restaurant'
);
SET @sql := IF(@has_fk = 0,
  'ALTER TABLE categories ADD CONSTRAINT fk_category_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add new unique constraint for restaurant_id + name
-- Unique index on (restaurant_id, name)
SET @has_unique := (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'categories' AND index_name = 'unique_restaurant_category'
);
SET @sql := IF(@has_unique = 0,
  'ALTER TABLE categories ADD UNIQUE KEY unique_restaurant_category (restaurant_id, name)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Update existing categories to belong to the first restaurant (if any)
UPDATE categories SET restaurant_id = (SELECT id FROM restaurants LIMIT 1) WHERE restaurant_id IS NULL;

-- Make restaurant_id NOT NULL after updating existing data
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'categories' AND column_name = 'restaurant_id' AND is_nullable = 'NO') = 0,
  'ALTER TABLE categories MODIFY restaurant_id INT NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

