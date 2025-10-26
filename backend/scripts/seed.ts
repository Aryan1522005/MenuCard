import { db } from '../src/db';
import { restaurants, categories, menuItems, users } from '../src/db/schema';
import bcrypt from 'bcrypt';
import 'dotenv/config';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Insert categories
    console.log('📦 Inserting categories...');
    const insertedCategories = await db.insert(categories).values([
      { name: 'Beverages', description: 'Hot and cold drinks', color: '#8B4513', sortOrder: 1 },
      { name: 'Pastries', description: 'Fresh baked goods', color: '#D2691E', sortOrder: 2 },
      { name: 'Sandwiches', description: 'Fresh sandwiches and wraps', color: '#228B22', sortOrder: 3 },
      { name: 'Pizza', description: 'Wood-fired pizzas', color: '#FF6347', sortOrder: 4 },
      { name: 'Pasta', description: 'Italian pasta dishes', color: '#FFD700', sortOrder: 5 },
      { name: 'Appetizers', description: 'Starters and small plates', color: '#9370DB', sortOrder: 6 },
      { name: 'Desserts', description: 'Sweet treats', color: '#FF69B4', sortOrder: 7 },
      { name: 'Drinks', description: 'Non-alcoholic beverages', color: '#00CED1', sortOrder: 8 },
    ]).returning();

    console.log(`✅ Inserted ${insertedCategories.length} categories`);

    // Insert restaurant
    console.log('🏪 Inserting restaurant...');
    const insertedRestaurants = await db.insert(restaurants).values([
      {
        name: 'Café Aroma',
        slug: 'cafe-aroma',
        logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop&crop=center',
        description: 'A cozy coffee shop serving artisanal beverages and fresh pastries',
        address: '123 Main Street, Coffee City',
        phone: '+1-555-0123',
        wifiName: 'CafeAroma_WiFi',
        wifiPassword: 'coffee123'
      }
    ]).returning();

    console.log(`✅ Inserted ${insertedRestaurants.length} restaurants`);

    // Insert menu items
    console.log('🍽️ Inserting menu items...');
    const beverageCategory = insertedCategories.find(c => c.name === 'Beverages');
    const pastryCategory = insertedCategories.find(c => c.name === 'Pastries');
    const sandwichCategory = insertedCategories.find(c => c.name === 'Sandwiches');

    const insertedMenuItems = await db.insert(menuItems).values([
      // Beverages
      {
        restaurantId: insertedRestaurants[0].id,
        categoryId: beverageCategory?.id,
        category: 'Beverages',
        name: 'Espresso',
        description: 'Rich, full-bodied coffee with a perfect crema',
        price: '3.50',
        imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6b0a08e?w=300&h=200&fit=crop&crop=center',
        availabilityTime: '06:00 - 18:00',
        sortOrder: 1,
        itemCode: 1,
        isVeg: true
      },
      {
        restaurantId: insertedRestaurants[0].id,
        categoryId: beverageCategory?.id,
        category: 'Beverages',
        name: 'Cappuccino',
        description: 'Espresso with steamed milk and foam',
        price: '4.25',
        imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop&crop=center',
        availabilityTime: '06:00 - 18:00',
        sortOrder: 2,
        itemCode: 2,
        isVeg: true
      },
      {
        restaurantId: insertedRestaurants[0].id,
        categoryId: beverageCategory?.id,
        category: 'Beverages',
        name: 'Café Latte',
        description: 'Smooth espresso with steamed milk',
        price: '4.75',
        imageUrl: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=300&h=200&fit=crop&crop=center',
        availabilityTime: '06:00 - 18:00',
        sortOrder: 3,
        itemCode: 3,
        isVeg: true
      },
      {
        restaurantId: insertedRestaurants[0].id,
        categoryId: beverageCategory?.id,
        category: 'Beverages',
        name: 'Americano',
        description: 'Espresso with hot water',
        price: '3.75',
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop&crop=center',
        availabilityTime: '06:00 - 18:00',
        sortOrder: 4,
        itemCode: 4,
        isVeg: true
      },
      // Pastries
      {
        restaurantId: insertedRestaurants[0].id,
        categoryId: pastryCategory?.id,
        category: 'Pastries',
        name: 'Butter Croissant',
        description: 'Flaky, buttery pastry baked fresh daily',
        price: '3.25',
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop&crop=center',
        availabilityTime: '07:00 - 15:00',
        sortOrder: 1,
        itemCode: 5,
        isVeg: true
      },
      {
        restaurantId: insertedRestaurants[0].id,
        categoryId: pastryCategory?.id,
        category: 'Pastries',
        name: 'Blueberry Muffin',
        description: 'Moist muffin packed with fresh blueberries',
        price: '3.75',
        imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop&crop=center',
        availabilityTime: '07:00 - 15:00',
        sortOrder: 2,
        itemCode: 6,
        isVeg: true
      },
      {
        restaurantId: insertedRestaurants[0].id,
        categoryId: pastryCategory?.id,
        category: 'Pastries',
        name: 'Cranberry Scone',
        description: 'Traditional scone with dried cranberries',
        price: '3.50',
        imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop&crop=center',
        availabilityTime: '07:00 - 15:00',
        sortOrder: 3,
        itemCode: 7,
        isVeg: true
      },
      // Sandwiches
      {
        restaurantId: insertedRestaurants[0].id,
        categoryId: sandwichCategory?.id,
        category: 'Sandwiches',
        name: 'Avocado Toast',
        description: 'Smashed avocado on sourdough with cherry tomatoes',
        price: '8.50',
        imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=300&h=200&fit=crop&crop=center',
        availabilityTime: '08:00 - 16:00',
        sortOrder: 1,
        itemCode: 8,
        isVeg: true
      },
      {
        restaurantId: insertedRestaurants[0].id,
        categoryId: sandwichCategory?.id,
        category: 'Sandwiches',
        name: 'Turkey & Swiss',
        description: 'Sliced turkey with Swiss cheese, lettuce, and tomato',
        price: '9.25',
        imageUrl: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=300&h=200&fit=crop&crop=center',
        availabilityTime: '08:00 - 16:00',
        sortOrder: 2,
        itemCode: 9,
        isVeg: false
      },
      {
        restaurantId: insertedRestaurants[0].id,
        categoryId: sandwichCategory?.id,
        category: 'Sandwiches',
        name: 'Grilled Cheese',
        description: 'Three-cheese blend on artisan bread',
        price: '7.75',
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop&crop=center',
        availabilityTime: '08:00 - 16:00',
        sortOrder: 3,
        itemCode: 10,
        isVeg: true
      }
    ]).returning();

    console.log(`✅ Inserted ${insertedMenuItems.length} menu items`);

    // Insert admin user
    console.log('👤 Inserting admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const insertedUsers = await db.insert(users).values([
      {
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        email: 'admin@restaurant.com',
        fullName: 'System Administrator'
      }
    ]).returning();

    console.log(`✅ Inserted ${insertedUsers.length} users`);

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${insertedCategories.length} categories`);
    console.log(`   - ${insertedRestaurants.length} restaurants`);
    console.log(`   - ${insertedMenuItems.length} menu items`);
    console.log(`   - ${insertedUsers.length} users`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed();
}

export { seed };
