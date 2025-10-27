const { Pool } = require('pg');
require('dotenv').config();

async function addRestaurantImageUrl() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_HOST?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Adding image_url column to restaurants table...');

    // Add image_url column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'restaurants' AND column_name = 'image_url'
          ) THEN
              ALTER TABLE restaurants ADD COLUMN image_url VARCHAR(500);
          END IF;
      END $$;
    `);

    console.log('✅ Successfully added image_url column to restaurants table!');

    // Verify the column was added
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'restaurants' 
      AND column_name = 'image_url';
    `);

    if (result.rows.length > 0) {
      console.log('📋 Column exists:', result.rows[0].column_name, '(', result.rows[0].data_type, ')');
    } else {
      console.log('⚠️ Column was not added. It may already exist.');
    }

  } catch (error) {
    console.error('❌ Error adding column:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

addRestaurantImageUrl()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

