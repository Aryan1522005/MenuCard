const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const setupSchema = async () => {
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };

  console.log('🔧 Setting up PostgreSQL schema...');

  const pool = new Pool(config);

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Read and execute the schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'postgresql-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Executing schema...');
    await client.query(schemaSQL);
    
    console.log('✅ Schema setup completed successfully!');
    console.log('📊 Tables created: restaurants, categories, menu_items, users, feedback');
    console.log('🌱 Sample data inserted');
    console.log('🔗 Triggers and indexes created');

    client.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Schema setup failed:', error.message);
    console.error('💡 Make sure your Neon database credentials are correct in .env file');
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupSchema();
}

module.exports = { setupSchema };
