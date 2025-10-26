const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

// MySQL configuration (source)
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'qr_menu_system',
};

// PostgreSQL configuration (destination - Neon)
const pgConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
};

async function migrateData() {
  const mysqlPool = mysql.createPool(mysqlConfig);
  const pgPool = new Pool(pgConfig);

  try {
    console.log('🔄 Starting data migration from MySQL to PostgreSQL...');

    // Test connections
    await mysqlPool.getConnection();
    console.log('✅ MySQL connection established');
    
    await pgPool.connect();
    console.log('✅ PostgreSQL connection established');

    // Migrate restaurants
    console.log('📦 Migrating restaurants...');
    const [restaurants] = await mysqlPool.execute('SELECT * FROM restaurants');
    for (const restaurant of restaurants) {
      await pgPool.query(`
        INSERT INTO restaurants (id, name, slug, logo_url, description, address, phone, wifi_name, wifi_password, custom_sections, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          logo_url = EXCLUDED.logo_url,
          description = EXCLUDED.description,
          address = EXCLUDED.address,
          phone = EXCLUDED.phone,
          wifi_name = EXCLUDED.wifi_name,
          wifi_password = EXCLUDED.wifi_password,
          custom_sections = EXCLUDED.custom_sections,
          updated_at = EXCLUDED.updated_at
      `, [
        restaurant.id, restaurant.name, restaurant.slug, restaurant.logo_url,
        restaurant.description, restaurant.address, restaurant.phone,
        restaurant.wifi_name, restaurant.wifi_password, restaurant.custom_sections,
        restaurant.created_at, restaurant.updated_at
      ]);
    }
    console.log(`✅ Migrated ${restaurants.length} restaurants`);

    // Migrate categories
    console.log('📦 Migrating categories...');
    const [categories] = await mysqlPool.execute('SELECT * FROM categories');
    for (const category of categories) {
      await pgPool.query(`
        INSERT INTO categories (id, name, description, color, sort_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          color = EXCLUDED.color,
          sort_order = EXCLUDED.sort_order,
          updated_at = EXCLUDED.updated_at
      `, [
        category.id, category.name, category.description, category.color,
        category.sort_order, category.created_at, category.updated_at
      ]);
    }
    console.log(`✅ Migrated ${categories.length} categories`);

    // Migrate menu items
    console.log('📦 Migrating menu items...');
    const [menuItems] = await mysqlPool.execute('SELECT * FROM menu_items');
    for (const item of menuItems) {
      await pgPool.query(`
        INSERT INTO menu_items (id, restaurant_id, category_id, category, name, description, price, image_url, availability_time, is_available, sort_order, item_code, is_veg, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          restaurant_id = EXCLUDED.restaurant_id,
          category_id = EXCLUDED.category_id,
          category = EXCLUDED.category,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          image_url = EXCLUDED.image_url,
          availability_time = EXCLUDED.availability_time,
          is_available = EXCLUDED.is_available,
          sort_order = EXCLUDED.sort_order,
          item_code = EXCLUDED.item_code,
          is_veg = EXCLUDED.is_veg,
          updated_at = EXCLUDED.updated_at
      `, [
        item.id, item.restaurant_id, item.category_id, item.category,
        item.name, item.description, item.price, item.image_url,
        item.availability_time, item.is_available, item.sort_order,
        item.item_code, item.is_veg, item.created_at, item.updated_at
      ]);
    }
    console.log(`✅ Migrated ${menuItems.length} menu items`);

    // Migrate users
    console.log('📦 Migrating users...');
    const [users] = await mysqlPool.execute('SELECT * FROM users');
    for (const user of users) {
      await pgPool.query(`
        INSERT INTO users (id, username, password, role, email, full_name, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at
      `, [
        user.id, user.username, user.password, user.role,
        user.email, user.full_name, user.is_active,
        user.created_at, user.updated_at
      ]);
    }
    console.log(`✅ Migrated ${users.length} users`);

    // Migrate feedback
    console.log('📦 Migrating feedback...');
    const [feedback] = await mysqlPool.execute('SELECT * FROM feedback');
    for (const fb of feedback) {
      await pgPool.query(`
        INSERT INTO feedback (id, restaurant_id, phone_number, food_quality, service, ambiance, pricing, comments, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          restaurant_id = EXCLUDED.restaurant_id,
          phone_number = EXCLUDED.phone_number,
          food_quality = EXCLUDED.food_quality,
          service = EXCLUDED.service,
          ambiance = EXCLUDED.ambiance,
          pricing = EXCLUDED.pricing,
          comments = EXCLUDED.comments,
          updated_at = EXCLUDED.updated_at
      `, [
        fb.id, fb.restaurant_id, fb.phone_number, fb.food_quality,
        fb.service, fb.ambiance, fb.pricing, fb.comments,
        fb.created_at, fb.updated_at
      ]);
    }
    console.log(`✅ Migrated ${feedback.length} feedback entries`);

    console.log('🎉 Data migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mysqlPool.end();
    await pgPool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
