-- Migration script to rename customer_name column to phone_number in feedback table
-- This script should be run to update the database schema

USE qr_menu_system;

-- First, check if the feedback table exists and has the customer_name column
-- If the table doesn't exist, create it with the new schema
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    phone_number VARCHAR(15),
    food_quality INT NOT NULL CHECK (food_quality >= 1 AND food_quality <= 5),
    service INT NOT NULL CHECK (service >= 1 AND service <= 5),
    ambiance INT NOT NULL CHECK (ambiance >= 1 AND ambiance <= 5),
    pricing INT NOT NULL CHECK (pricing >= 1 AND pricing <= 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_restaurant_created (restaurant_id, created_at),
    INDEX idx_phone_number (phone_number)
);

-- If the table exists with customer_name column, rename it to phone_number
-- This will only execute if the customer_name column exists
SET @sql = (
    SELECT IF(
        COUNT(*) > 0,
        'ALTER TABLE feedback CHANGE COLUMN customer_name phone_number VARCHAR(15)',
        'SELECT "Column customer_name does not exist, no migration needed" as message'
    )
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'qr_menu_system' 
    AND TABLE_NAME = 'feedback' 
    AND COLUMN_NAME = 'customer_name'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on phone_number if it doesn't exist
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE feedback ADD INDEX idx_phone_number (phone_number)',
        'SELECT "Index on phone_number already exists" as message'
    )
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'qr_menu_system' 
    AND TABLE_NAME = 'feedback' 
    AND INDEX_NAME = 'idx_phone_number'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show the final table structure
DESCRIBE feedback;
