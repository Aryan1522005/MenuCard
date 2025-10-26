const { Pool } = require('pg');
require('dotenv').config();

// Test PostgreSQL connection configuration
const testPostgreSQLConnection = async () => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qr_menu_system',
    ssl: process.env.DB_HOST?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  };

  console.log('🔍 Testing PostgreSQL connection...');
  console.log('Configuration:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    ssl: config.ssl
  });

  const pool = new Pool(config);

  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('📅 Database time:', result.rows[0].current_time);
    
    // Test if our tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 Available tables:', tablesResult.rows.map(row => row.table_name));
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.error('💡 Make sure to:');
    console.error('   1. Set up your Neon database');
    console.error('   2. Configure your .env file with correct credentials');
    console.error('   3. Run the PostgreSQL schema script');
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testPostgreSQLConnection();
}

module.exports = { testPostgreSQLConnection };
