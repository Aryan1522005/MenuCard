-- Add restaurant information fields to restaurants table

-- Add address field
ALTER TABLE restaurants ADD COLUMN address TEXT AFTER description;

-- Add phone number field
ALTER TABLE restaurants ADD COLUMN phone VARCHAR(50) AFTER address;

-- Add WiFi name field
ALTER TABLE restaurants ADD COLUMN wifi_name VARCHAR(100) AFTER phone;

-- Add WiFi password field
ALTER TABLE restaurants ADD COLUMN wifi_password VARCHAR(100) AFTER wifi_name;

-- Add custom sections as JSON field (for flexible custom sections)
ALTER TABLE restaurants ADD COLUMN custom_sections JSON AFTER wifi_password;

