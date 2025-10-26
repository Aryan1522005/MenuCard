USE qr_menu_system;

-- Check table structure
DESCRIBE feedback;

-- Check recent feedback entries
SELECT id, phone_number, food_quality, service, ambiance, pricing, comments, created_at 
FROM feedback 
ORDER BY created_at DESC 
LIMIT 10;

