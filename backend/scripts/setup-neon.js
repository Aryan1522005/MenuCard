#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 QR Menu System - Neon PostgreSQL Setup');
console.log('==========================================\n');

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

// Check package.json for pg dependency
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

if (!packageJson.dependencies.pg) {
  console.log('📦 PostgreSQL driver (pg) not found in dependencies.');
  console.log('   Please run: npm install pg\n');
} else {
  console.log('✅ PostgreSQL driver (pg) is installed.\n');
}

console.log('📋 Next Steps:');
console.log('1. Set up your Neon database at https://neon.tech');
console.log('2. Update your .env file with Neon credentials');
console.log('3. Run the PostgreSQL schema: node scripts/setup-schema.js');
console.log('4. Test connection: node scripts/test-postgresql.js');
console.log('5. Migrate data (if needed): node scripts/migrate-to-postgresql.js');
console.log('6. Start server: npm run dev\n');

console.log('📚 For detailed instructions, see: NEON_MIGRATION_GUIDE.md');
