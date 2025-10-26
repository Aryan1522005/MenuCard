import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

// Database configuration
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

console.log('Database connection string:', connectionString.replace(/:[^:@]*@/, ':***@')); // Hide password in logs

// Create postgres client
const client = postgres(connectionString, {
  ssl: process.env.DB_HOST?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Test database connection
export const testConnection = async () => {
  try {
    await client`SELECT NOW()`;
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export default db;
