import { db } from '../src/db';
import { restaurants, categories, menuItems } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function testDrizzleSetup() {
  console.log('🧪 Testing Drizzle ORM setup...');

  try {
    // Test basic connection
    console.log('🔌 Testing database connection...');
    const result = await db.execute('SELECT NOW() as current_time');
    console.log('✅ Database connection successful');
    console.log('📅 Database time:', result[0]?.current_time);

    // Test schema queries
    console.log('📋 Testing schema queries...');
    
    // Count tables
    const categoriesCount = await db.select().from(categories);
    const restaurantsCount = await db.select().from(restaurants);
    const menuItemsCount = await db.select().from(menuItems);

    console.log(`✅ Categories: ${categoriesCount.length} records`);
    console.log(`✅ Restaurants: ${restaurantsCount.length} records`);
    console.log(`✅ Menu Items: ${menuItemsCount.length} records`);

    // Test a join query
    if (restaurantsCount.length > 0 && menuItemsCount.length > 0) {
      console.log('🔗 Testing join queries...');
      const restaurantWithMenu = await db
        .select({
          restaurantName: restaurants.name,
          menuItemName: menuItems.name,
          menuItemPrice: menuItems.price,
        })
        .from(restaurants)
        .leftJoin(menuItems, eq(restaurants.id, menuItems.restaurantId))
        .limit(5);

      console.log('✅ Join query successful');
      console.log('📊 Sample data:', restaurantWithMenu);
    }

    console.log('🎉 Drizzle ORM setup test completed successfully!');

  } catch (error) {
    console.error('❌ Drizzle setup test failed:', error);
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDrizzleSetup();
}

export { testDrizzleSetup };
