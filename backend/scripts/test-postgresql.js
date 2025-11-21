const { Pool } = require('pg');
require('dotenv').config();

// Helper to convert Neon host to pooler host
function convertToPoolerHost(host) {
  if (!host) return host;
  if (host.includes('.pooler.neon.tech')) return host;
  if (host.includes('.neon.tech') && !host.includes('.pooler.')) {
    // Extract the endpoint ID (ep-xxx part)
    const endpointMatch = host.match(/^(ep-[^.\s]+)/);
    if (endpointMatch) {
      const endpointId = endpointMatch[1];
      const poolerHost = `${endpointId}.pooler.neon.tech`;
      console.log('🔄 Using Neon connection pooler for better scalability');
      return poolerHost;
    }
    // Fallback to simple replace if pattern doesn't match
    const poolerHost = host.replace('.neon.tech', '.pooler.neon.tech');
    console.log('🔄 Using Neon connection pooler for better scalability');
    return poolerHost;
  }
  return host;
}

// Test PostgreSQL connection configuration
const testPostgreSQLConnection = async () => {
  const host = convertToPoolerHost(process.env.DB_HOST);
  
  const config = {
    host: host || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qr_menu_system',
    ssl: host?.includes('neon.tech') || host?.includes('pooler') 
      ? { rejectUnauthorized: false } 
      : false,
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
