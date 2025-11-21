import { defineConfig } from 'drizzle-kit';

// Helper to convert Neon host to pooler host
function getPoolerHost(host: string | undefined): string | undefined {
  if (!host) return host;
  if (host.includes('.pooler.neon.tech')) return host;
  if (host.includes('.neon.tech') && !host.includes('.pooler.')) {
    // Extract the endpoint ID (ep-xxx part)
    const endpointMatch = host.match(/^(ep-[^.\s]+)/);
    if (endpointMatch) {
      const endpointId = endpointMatch[1];
      return `${endpointId}.pooler.neon.tech`;
    }
    // Fallback to simple replace if pattern doesn't match
    return host.replace('.neon.tech', '.pooler.neon.tech');
  }
  return host;
}

const dbHost = getPoolerHost(process.env.DB_HOST);

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: dbHost!,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    ssl: dbHost?.includes('neon.tech') || dbHost?.includes('pooler') 
      ? { rejectUnauthorized: false } 
      : false,
  },
  verbose: true,
  strict: true,
});
