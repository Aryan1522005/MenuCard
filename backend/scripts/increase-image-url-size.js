// Script to increase image URL field sizes in PostgreSQL database
// This changes VARCHAR(500) to TEXT for better support of long URLs

const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../config/database');

async function increaseImageUrlSize() {
  try {
    console.log('🔍 Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    console.log('✅ Database connected successfully\n');
    
    // Read and execute the SQL migration
    const sqlPath = path.join(__dirname, '../database/increase-image-url-size.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing migration to increase image URL sizes...');
    console.log('   - restaurants.logo_url: VARCHAR(500) → TEXT');
    console.log('   - categories.image_url: VARCHAR(500) → TEXT');
    console.log('   - menu_items.image_url: VARCHAR(500) → TEXT\n');
    
    // Execute each ALTER TABLE statement separately
    await pool.execute('ALTER TABLE restaurants ALTER COLUMN logo_url TYPE TEXT');
    console.log('✅ Updated restaurants.logo_url');
    
    await pool.execute('ALTER TABLE categories ALTER COLUMN image_url TYPE TEXT');
    console.log('✅ Updated categories.image_url');
    
    await pool.execute('ALTER TABLE menu_items ALTER COLUMN image_url TYPE TEXT');
    console.log('✅ Updated menu_items.image_url');
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('   Image URL fields can now accept URLs of any length.');
    
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the migration
increaseImageUrlSize();

