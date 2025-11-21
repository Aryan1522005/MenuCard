// PostgreSQL to MySQL2 Compatibility Wrapper
// This wrapper makes PostgreSQL's pg library work like MySQL2
// Allows minimal code changes when migrating from MySQL to PostgreSQL

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration for PostgreSQL (Neon)
// Support both DATABASE_URL (connection string) and individual env vars
// Automatically uses connection pooler for better scalability (1000+ concurrent connections)

// Helper function to convert Neon direct connection to pooler connection
function convertToPoolerUrl(connectionString) {
  if (!connectionString) return connectionString;
  
  // Check if already using pooler (both formats: -pooler in ID or .pooler.neon.tech)
  if (connectionString.includes('.pooler.neon.tech') || 
      connectionString.match(/@ep-[^-]+-pooler[^@]*@/) ||
      connectionString.includes('-pooler.')) {
    // Already using pooler, just ensure sslmode is set
    if (!connectionString.includes('sslmode=')) {
      connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
    }
    
    // Extract endpoint ID and convert to simpler pooler format for better reliability
    // Neon supports both formats, but simpler format (ep-xxx.pooler.neon.tech) is more reliable
    const endpointMatch = connectionString.match(/@(ep-[^-]+)-pooler[^@]*@/);
    if (endpointMatch) {
      const endpointId = endpointMatch[1];
      // Convert from: ep-xxx-pooler.c-2.us-east-1.aws.neon.tech
      // To: ep-xxx.pooler.neon.tech (simpler, more reliable format)
      connectionString = connectionString.replace(
        /@ep-[^-]+-pooler[^:\/]+\.neon\.tech/,
        `@${endpointId}.pooler.neon.tech`
      );
      console.log('🔄 Converted to simpler pooler format for better reliability');
    }
    
    console.log('✅ Using Neon connection pooler (pgbouncer)');
    return connectionString;
  }
  
  // Convert direct Neon connection to pooler
  // Neon hostnames can be: ep-xxx.neon.tech, ep-xxx.us-east-2.aws.neon.tech, ep-xxx.c-2.us-east-1.aws.neon.tech
  // Pooler format options:
  //   1. ep-xxx.pooler.neon.tech (simpler format)
  //   2. ep-xxx-pooler.c-2.us-east-1.aws.neon.tech (longer format - what Neon provides)
  if (connectionString.includes('.neon.tech') && !connectionString.includes('pooler')) {
    // Extract the endpoint ID from the connection string
    const endpointMatch = connectionString.match(/@(ep-[^.\s:]+)/);
    if (endpointMatch) {
      const endpointId = endpointMatch[1];
      // Use the simpler pooler format: ep-xxx.pooler.neon.tech
      connectionString = connectionString.replace(
        /@[^:\/]+\.neon\.tech/,
        `@${endpointId}.pooler.neon.tech`
      );
    } else {
      // Fallback to simple replace if pattern doesn't match
      connectionString = connectionString.replace(
        /@([^:]+)\.neon\.tech/,
        '@$1.pooler.neon.tech'
      );
    }
    
    // Ensure sslmode is set for pooler
    if (!connectionString.includes('sslmode=')) {
      connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
    }
    
    console.log('🔄 Using Neon connection pooler for better scalability');
  }
  
  return connectionString;
}

// Helper function to convert DB_HOST to pooler host
function convertToPoolerHost(host) {
  if (!host) return host;
  
  // Check if already using pooler (both formats: -pooler in ID or .pooler.neon.tech)
  if (host.includes('.pooler.neon.tech') || 
      host.includes('-pooler.') ||
      host.match(/^ep-[^-]+-pooler/)) {
    // Already using pooler, return as-is
    return host;
  }
  
  // Convert direct Neon connection to pooler
  // Neon hostnames can be: ep-xxx.neon.tech, ep-xxx.us-east-2.aws.neon.tech, ep-xxx.c-2.us-east-1.aws.neon.tech
  // Pooler format options:
  //   1. ep-xxx.pooler.neon.tech (simpler format)
  //   2. ep-xxx-pooler.c-2.us-east-1.aws.neon.tech (longer format - what Neon provides)
  if (host.includes('.neon.tech') && !host.includes('pooler')) {
    // Extract the endpoint ID (ep-xxx part)
    const endpointMatch = host.match(/^(ep-[^.\s]+)/);
    if (endpointMatch) {
      const endpointId = endpointMatch[1];
      // Use the simpler pooler format: ep-xxx.pooler.neon.tech
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

let pgPool;

if (process.env.DATABASE_URL) {
  // Use connection string if provided (Railway, Neon, etc.)
  // Automatically convert to pooler for Neon connections
  const connectionString = convertToPoolerUrl(process.env.DATABASE_URL);
  
  // Log connection info (hide password)
  const logUrl = connectionString.replace(/:[^:@]*@/, ':***@');
  console.log('🔗 Database connection:', logUrl);
  
  pgPool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    max: 20, // App-level pool - pooler (pgbouncer) handles 1000+ concurrent connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // When using Neon pooler, we can use smaller app pool since pooler handles scaling
    // The pooler maintains its own connection pool to the database
  });
} else {
  // Use individual environment variables
  // Automatically convert to pooler for Neon connections
  const host = convertToPoolerHost(process.env.DB_HOST);
  
  const dbConfig = {
    host: host || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qr_menu_system',
    // Enable SSL for cloud databases (Neon, Railway, etc.)
    ssl: process.env.NODE_ENV === 'production' || host?.includes('neon') || host?.includes('pooler') 
      ? { rejectUnauthorized: false } 
      : false,
    max: 20, // App-level pool - pooler handles 1000+ concurrent connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout for cloud databases
  };
  pgPool = new Pool(dbConfig);
}

// Helper function to convert MySQL placeholders (?) to PostgreSQL ($1, $2, etc.)
function convertPlaceholders(sql, params) {
  let index = 0;
  const convertedSql = sql.replace(/\?/g, () => {
    index++;
    return `$${index}`;
  });
  return convertedSql;
}

// Helper function to convert MySQL functions to PostgreSQL
function convertMySQLToPostgreSQL(sql) {
  // Convert DATABASE() to current_database()
  sql = sql.replace(/DATABASE\(\)/gi, 'current_database()');
  
  // Convert MySQL's INFORMATION_SCHEMA queries to PostgreSQL format
  sql = sql.replace(
    /FROM INFORMATION_SCHEMA\.COLUMNS\s+WHERE TABLE_SCHEMA = current_database\(\)/gi,
    "FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'public'"
  );
  
  // Convert LIKE to ILIKE for case-insensitive search (PostgreSQL feature)
  // sql = sql.replace(/\bLIKE\b/gi, 'ILIKE');
  
  return sql;
}

// Wrapper pool that mimics MySQL2's behavior
const pool = {
  // Execute method (MySQL2 style) - converts to PostgreSQL query
  async execute(sql, params = []) {
    try {
      // Convert MySQL syntax to PostgreSQL
      let convertedSql = convertMySQLToPostgreSQL(sql);
      convertedSql = convertPlaceholders(convertedSql, params);
      
      // Check statement type
      const sqlUpper = sql.trim().toUpperCase();
      const isInsert = /^INSERT\s+INTO/i.test(sql.trim());
      const isUpdate = /^UPDATE/i.test(sql.trim());
      const isDelete = /^DELETE/i.test(sql.trim());
      
      // Check if it's an INSERT statement and add RETURNING clause if not present
      if (isInsert && !/RETURNING/i.test(convertedSql)) {
        // Add RETURNING id to INSERT statements
        convertedSql += ' RETURNING id';
      }
      
      // Execute query
      const result = await pgPool.query(convertedSql, params);
      
      // For INSERT statements, wrap the result to mimic MySQL behavior
      if (isInsert) {
        const insertId = result.rows.length > 0 ? result.rows[0].id : null;
        return [{
          insertId,
          affectedRows: result.rowCount,
          changedRows: result.rowCount
        }, []];
      }
      
      // For UPDATE and DELETE statements, wrap the result to include affectedRows
      if (isUpdate || isDelete) {
        return [{
          affectedRows: result.rowCount,
          changedRows: result.rowCount,
          insertId: null
        }, []];
      }
      
      // Return in MySQL2 format: [rows, fields]
      // MySQL2 returns an array where [0] is rows and [1] is field info
      return [result.rows, result.fields || []];
    } catch (error) {
      console.error('Query error:', error.message);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  },

  // Query method (also available) - same as execute for compatibility
  async query(sql, params = []) {
    // Handle bulk insert case: VALUES ?
    if (sql.includes('VALUES ?') && Array.isArray(params[0])) {
      return await this.bulkInsert(sql, params[0]);
    }
    
    const result = await this.execute(sql, params);
    
    // For INSERT/UPDATE/DELETE, we wrap the result to mimic MySQL behavior
    // But we should return the actual result rows for SELECT queries
    // The issue is that execute() returns different structures
    
    // Check if first element is an object with insertId/affectedRows (INSERT/UPDATE/DELETE)
    if (Array.isArray(result) && result[0] && typeof result[0] === 'object' && 
        ('insertId' in result[0] || 'affectedRows' in result[0])) {
      // This is the wrapped result from execute for INSERT/UPDATE/DELETE
      return result;
    }
    
    // For SELECT queries, return the actual rows
    return result;
  },

  // Special handler for bulk inserts
  async bulkInsert(sql, values) {
    try {
      // Convert bulk insert syntax
      // MySQL: INSERT INTO table (col1, col2) VALUES ?
      // PostgreSQL: INSERT INTO table (col1, col2) VALUES ($1, $2), ($3, $4), ...
      
      const numColumns = values[0]?.length || 0;
      const placeholders = values.map((_, rowIndex) => {
        const rowPlaceholders = Array.from(
          { length: numColumns },
          (_, colIndex) => `$${rowIndex * numColumns + colIndex + 1}`
        ).join(', ');
        return `(${rowPlaceholders})`;
      }).join(', ');
      
      const convertedSql = sql.replace('VALUES ?', `VALUES ${placeholders}`);
      const flatParams = values.flat();
      
      const result = await pgPool.query(convertedSql, flatParams);
      
      return [{ affectedRows: result.rowCount, insertId: null }, []];
    } catch (error) {
      console.error('Bulk insert error:', error.message);
      throw error;
    }
  },

  // Get a client from the pool (for transactions)
  async connect() {
    const client = await pgPool.connect();
    
    let inTransaction = false;
    
    // Wrap the client to use our execute method
    return {
      ...client,
      execute: async (sql, params) => {
        const sqlUpper = sql.trim().toUpperCase();
        const isInsert = /^INSERT\s+INTO/i.test(sql.trim());
        const isUpdate = /^UPDATE/i.test(sql.trim());
        const isDelete = /^DELETE/i.test(sql.trim());
        
        let convertedSql = convertPlaceholders(convertMySQLToPostgreSQL(sql), params);
        
        if (isInsert && !/RETURNING/i.test(convertedSql)) {
          convertedSql += ' RETURNING id';
        }
        
        const result = await client.query(convertedSql, params);
        
        if (isInsert) {
          const insertId = result.rows.length > 0 ? result.rows[0].id : null;
          return [{
            insertId,
            affectedRows: result.rowCount,
            changedRows: result.rowCount
          }, []];
        }
        
        if (isUpdate || isDelete) {
          return [{
            affectedRows: result.rowCount,
            changedRows: result.rowCount,
            insertId: null
          }, []];
        }
        
        return [result.rows, result.fields || []];
      },
      beginTransaction: async () => {
        await client.query('BEGIN');
        inTransaction = true;
      },
      commit: async () => {
        await client.query('COMMIT');
        inTransaction = false;
      },
      rollback: async () => {
        await client.query('ROLLBACK');
        inTransaction = false;
      },
      release: () => client.release(),
    };
  },
  
  // Alias for connect() to match MySQL2 API
  async getConnection() {
    return await this.connect();
  },

  // End the pool
  async end() {
    await pgPool.end();
  },
};

// Test database connection
const testConnection = async () => {
  try {
    const [rows] = await pool.execute('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    console.log('📅 Current time:', rows[0]?.current_time);
    
    // Check if we're using pooler by querying pg_stat_activity
    try {
      const [poolerCheck] = await pool.execute(`
        SELECT application_name, backend_type 
        FROM pg_stat_activity 
        WHERE pid = pg_backend_pid()
      `);
      if (poolerCheck && poolerCheck.length > 0) {
        const appName = poolerCheck[0]?.application_name || 'unknown';
        const backendType = poolerCheck[0]?.backend_type || 'unknown';
        console.log('🔍 Connection info - Application:', appName, '| Backend:', backendType);
        // Note: When using pooler, you'll see pgbouncer in pg_stat_activity
        // The "client backend" type is normal for pooled connections
        if (appName.includes('pgbouncer') || process.env.DATABASE_URL?.includes('pooler')) {
          console.log('✅ Connection is using Neon pooler (pgbouncer)');
        }
      }
    } catch (checkError) {
      // Ignore if we can't check (might not have permissions)
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};
