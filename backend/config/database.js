// PostgreSQL to MySQL2 Compatibility Wrapper
// This wrapper makes PostgreSQL's pg library work like MySQL2
// Allows minimal code changes when migrating from MySQL to PostgreSQL

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration for PostgreSQL (Neon)
// Support both DATABASE_URL (connection string) and individual env vars
let pgPool;

if (process.env.DATABASE_URL) {
  // Use connection string if provided (Railway, Neon, etc.)
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
} else {
  // Use individual environment variables
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qr_menu_system',
    // Enable SSL for cloud databases (Neon, Railway, etc.)
    ssl: process.env.NODE_ENV === 'production' || process.env.DB_HOST?.includes('neon') || process.env.DB_HOST?.includes('pooler') 
      ? { rejectUnauthorized: false } 
      : false,
    max: 20,
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
