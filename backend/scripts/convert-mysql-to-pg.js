// Script to convert MySQL queries to PostgreSQL format
const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../routes');
const files = ['menu.js', 'admin.js', 'categories.js', 'qr.js', 'users.js'];

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace pool.execute with pool.query
  content = content.replace(/pool\.execute\(/g, 'pool.query(');
  
  // Convert ? placeholders to $1, $2, etc.
  let paramCount = 0;
  content = content.replace(/(['"])(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)([^'"]*)\1/gi, (match) => {
    paramCount = 0;
    return match.replace(/\?/g, () => `$${++paramCount}`);
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Converted ${file}`);
});

console.log('✅ All files converted successfully!');

