const { Pool } = require('pg');
require('dotenv').config();

const insertSampleData = async () => {
  console.log('🌱 Starting to insert sample data...');

  let config;
  
  if (process.env.DATABASE_URL) {
    config = {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    };
  } else {
    config = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.NODE_ENV === 'production' || process.env.DB_HOST?.includes('neon') || process.env.DB_HOST?.includes('pooler') 
        ? { rejectUnauthorized: false } 
        : false,
    };
  }

  const pool = new Pool(config);

  try {
    await pool.query('BEGIN');

    console.log('📦 Inserting categories...');
    await pool.query(`
      INSERT INTO categories (name, description, color, sort_order) VALUES 
      ('Beverages', 'Hot and cold drinks', '#8B4513', 1),
      ('Pastries', 'Fresh baked goods', '#D2691E', 2),
      ('Sandwiches', 'Fresh sandwiches and wraps', '#228B22', 3),
      ('Pizza', 'Wood-fired pizzas', '#FF6347', 4),
      ('Pasta', 'Italian pasta dishes', '#FFD700', 5),
      ('Appetizers', 'Starters and small plates', '#9370DB', 6),
      ('Desserts', 'Sweet treats', '#FF69B4', 7),
      ('Drinks', 'Non-alcoholic beverages', '#00CED1', 8)
      ON CONFLICT (name) DO NOTHING
    `);

    console.log('🏪 Inserting restaurant...');
    const restaurantResult = await pool.query(`
      INSERT INTO restaurants (name, slug, logo_url, description) 
      VALUES ('Café Aroma', 'cafe-aroma', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop&crop=center', 'A cozy coffee shop serving artisanal beverages and fresh pastries')
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
    `);

    if (restaurantResult.rows.length === 0) {
      console.log('⚠️ Restaurant already exists, getting ID...');
      const existing = await pool.query('SELECT id FROM restaurants WHERE slug = $1', ['cafe-aroma']);
      if (existing.rows.length > 0) {
        console.log('✅ Found existing restaurant');
      }
    }

    console.log('🍽️ Inserting menu items...');
    await pool.query(`
      WITH cat AS (SELECT id FROM categories WHERE name IN ('Beverages', 'Pastries', 'Sandwiches'))
      INSERT INTO menu_items (restaurant_id, category_id, category, name, description, price, image_url, availability_time, sort_order, item_code, is_veg) VALUES 
      (1, (SELECT id FROM categories WHERE name = 'Beverages'), 'Beverages', 'Espresso', 'Rich, full-bodied coffee with a perfect crema', 3.50, 'https://images.unsplash.com/photo-1510591509098-f4fdc6b0a08e?w=300&h=200&fit=crop&crop=center', '06:00 - 18:00', 1, 1, true),
      (1, (SELECT id FROM categories WHERE name = 'Beverages'), 'Beverages', 'Cappuccino', 'Espresso with steamed milk and foam', 4.25, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop&crop=center', '06:00 - 18:00', 2, 2, true),
      (1, (SELECT id FROM categories WHERE name = 'Beverages'), 'Beverages', 'Café Latte', 'Smooth espresso with steamed milk', 4.75, 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=300&h=200&fit=crop&crop=center', '06:00 - 18:00', 3, 3, true),
      (1, (SELECT id FROM categories WHERE name = 'Beverages'), 'Beverages', 'Americano', 'Espresso with hot water', 3.75, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop&crop=center', '06:00 - 18:00', 4, 4, true),
      (1, (SELECT id FROM categories WHERE name = 'Pastries'), 'Pastries', 'Butter Croissant', 'Flaky, buttery pastry baked fresh daily', 3.25, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop&crop=center', '07:00 - 15:00', 1, 5, true),
      (1, (SELECT id FROM categories WHERE name = 'Pastries'), 'Pastries', 'Blueberry Muffin', 'Moist muffin packed with fresh blueberries', 3.75, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop&crop=center', '07:00 - 15:00', 2, 6, true),
      (1, (SELECT id FROM categories WHERE name = 'Pastries'), 'Pastries', 'Cranberry Scone', 'Traditional scone with dried cranberries', 3.50, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop&crop=center', '07:00 - 15:00', 3, 7, true),
      (1, (SELECT id FROM categories WHERE name = 'Sandwiches'), 'Sandwiches', 'Avocado Toast', 'Smashed avocado on sourdough with cherry tomatoes', 8.50, 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=300&h=200&fit=crop&crop=center', '08:00 - 16:00', 1, 8, true),
      (1, (SELECT id FROM categories WHERE name = 'Sandwiches'), 'Sandwiches', 'Turkey & Swiss', 'Sliced turkey with Swiss cheese, lettuce, and tomato', 9.25, 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=300&h=200&fit=crop&crop=center', '08:00 - 16:00', 2, 9, false),
      (1, (SELECT id FROM categories WHERE name = 'Sandwiches'), 'Sandwiches', 'Grilled Cheese', 'Three-cheese blend on artisan bread', 7.75, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop&crop=center', '08:00 - 16:00', 3, 10, true)
      ON CONFLICT DO NOTHING
    `);

    await pool.query('COMMIT');
    console.log('✅ Sample data inserted successfully!');
    
    // Test the connection
    const testResult = await pool.query('SELECT * FROM restaurants WHERE slug = $1', ['cafe-aroma']);
    if (testResult.rows.length > 0) {
      console.log('🎉 Restaurant "Café Aroma" is now in the database!');
      console.log('📍 Slug: cafe-aroma');
      console.log('🔗 Test URL: https://menucard-production.up.railway.app/api/menu/cafe-aroma');
    }

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error inserting data:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
};

// Run if executed directly
if (require.main === module) {
  insertSampleData();
}

module.exports = { insertSampleData };

