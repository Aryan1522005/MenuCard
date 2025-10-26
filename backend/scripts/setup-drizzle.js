#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 QR Menu System - Drizzle ORM Setup');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  const envTemplate = `# Neon PostgreSQL Configuration
DB_HOST=your-neon-host.neon.tech
DB_PORT=5432
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database-name

# Alternative: Use connection string
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# CORS Configuration
FRONTEND_URL=http://localhost:3000
`;
  
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ .env file created! Please update it with your Neon credentials.\n');
} else {
  console.log('✅ .env file already exists.\n');
}

// Check package.json for required dependencies
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const requiredDeps = ['drizzle-orm', 'postgres', 'pg'];
const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  console.log('📦 Missing dependencies:', missingDeps.join(', '));
  console.log('   Please run: npm install\n');
} else {
  console.log('✅ All required dependencies are installed.\n');
}

console.log('📋 Next Steps:');
console.log('1. Set up your Neon database at https://neon.tech');
console.log('2. Update your .env file with Neon credentials');
console.log('3. Push schema to Neon: npm run db:push');
console.log('4. Seed database: npm run db:seed');
console.log('5. Test setup: npm run test-drizzle');
console.log('6. Start server: npm run dev\n');

console.log('🛠️ Available Commands:');
console.log('   npm run db:push      - Push schema to database');
console.log('   npm run db:generate  - Generate migration files');
console.log('   npm run db:migrate   - Apply migrations');
console.log('   npm run db:studio    - Open Drizzle Studio');
console.log('   npm run db:seed      - Seed with sample data');
console.log('   npm run test-drizzle - Test Drizzle setup\n');

console.log('📚 For detailed instructions, see: DRIZZLE_SETUP_GUIDE.md');
