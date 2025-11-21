import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

// Database configuration
// Helper function to convert Neon direct connection to pooler connection
function convertToPoolerUrl(connectionString: string): string {
  if (!connectionString) return connectionString;
  
  // Check if already using pooler (both formats: -pooler in ID or .pooler.neon.tech)
  if (connectionString.includes('.pooler.neon.tech') || 
      connectionString.match(/@ep-[^-]+-pooler[^@]*@/) ||
      connectionString.includes('-pooler.')) {
    // Already using pooler, just ensure sslmode is set
    if (!connectionString.includes('sslmode=')) {
      connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
    }
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
function convertToPoolerHost(host: string | undefined): string | undefined {
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

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  const host = convertToPoolerHost(process.env.DB_HOST);
  connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${host}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
} else {
  connectionString = convertToPoolerUrl(connectionString);
}

console.log('Database connection string:', connectionString.replace(/:[^:@]*@/, ':***@')); // Hide password in logs

// Create postgres client
const client = postgres(connectionString, {
  ssl: process.env.DB_HOST?.includes('neon.tech') || connectionString.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false,
  max: 20, // App-level pool - pooler handles 1000+ concurrent connections
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
