const { Pool } = require('pg');
require('dotenv').config();

async function addCategoryColumns() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_HOST?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Adding restaurant_id and image_url columns to categories table...');

    // Add restaurant_id column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'categories' AND column_name = 'restaurant_id'
          ) THEN
              ALTER TABLE categories ADD COLUMN restaurant_id INTEGER;
              
              -- Update existing categories to belong to the first restaurant (if any)
              UPDATE categories 
              SET restaurant_id = (SELECT id FROM restaurants LIMIT 1) 
              WHERE restaurant_id IS NULL;
              
              -- Add foreign key constraint
              ALTER TABLE categories 
              ADD CONSTRAINT fk_category_restaurant 
              FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;
              
              -- Make restaurant_id NOT NULL after updating existing data
              ALTER TABLE categories ALTER COLUMN restaurant_id SET NOT NULL;
              
              -- Add unique constraint for restaurant_id + name
              CREATE UNIQUE INDEX IF NOT EXISTS unique_restaurant_category 
              ON categories(restaurant_id, name);
          END IF;
      END $$;
    `);

    // Add image_url column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'categories' AND column_name = 'image_url'
          ) THEN
              ALTER TABLE categories ADD COLUMN image_url VARCHAR(500);
          END IF;
      END $$;
    `);

    console.log('✅ Successfully added restaurant_id and image_url columns to categories table!');

    // Verify the columns were added
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'categories' 
      AND column_name IN ('restaurant_id', 'image_url')
      ORDER BY column_name;
    `);

    console.log('📋 Added columns:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

addCategoryColumns()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

