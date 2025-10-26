-- Add restaurant image URL column to restaurants table
ALTER TABLE restaurants ADD COLUMN image_url VARCHAR(500) AFTER logo_url;
