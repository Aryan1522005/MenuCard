# Drizzle ORM Setup Guide for Neon PostgreSQL

## Overview
This guide will help you set up Drizzle ORM with Neon PostgreSQL for your QR Menu System. Drizzle provides excellent TypeScript support and better schema management.

## Prerequisites
- Neon account (free tier available at [neon.tech](https://neon.tech))
- Node.js installed locally
- TypeScript support

## Step 1: Set Up Neon Database

### 1.1 Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project

### 1.2 Get Connection Details
1. In your Neon dashboard, go to "Connection Details"
2. Copy the connection string or individual details:
   - Host
   - Database name
   - Username
   - Password
   - Port (usually 5432)

## Step 2: Configure Environment Variables

### 2.1 Create .env file
Create a `.env` file in the `backend` directory:

```env
# Neon PostgreSQL Configuration
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
```

### 2.2 For Vercel Deployment
Add these environment variables in your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all the variables from your `.env` file

## Step 3: Push Schema to Neon

### 3.1 Push Schema Directly
```bash
cd backend
npm run db:push
```

This command will:
- Connect to your Neon database
- Create all tables based on your Drizzle schema
- Set up indexes and constraints
- Create triggers for automatic timestamp updates

### 3.2 Generate and Run Migrations (Alternative)
```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate
```

## Step 4: Seed Database with Sample Data

```bash
npm run db:seed
```

This will populate your database with:
- 8 categories (Beverages, Pastries, Sandwiches, etc.)
- 1 sample restaurant (Café Aroma)
- 10 sample menu items
- 1 admin user (username: admin, password: admin123)

## Step 5: Test Database Connection

```bash
npm run test-db
```

## Step 6: Start Development Server

```bash
npm run dev
```

## Available Drizzle Commands

```bash
# Push schema changes to database
npm run db:push

# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

## Schema Structure

### Tables Created
- **restaurants**: Restaurant information
- **categories**: Menu categories
- **menu_items**: Individual menu items
- **users**: Admin users
- **feedback**: Customer feedback

### Key Features
- **Type Safety**: Full TypeScript support
- **Relations**: Proper foreign key relationships
- **Indexes**: Optimized for performance
- **Constraints**: Data validation at database level
- **Triggers**: Automatic timestamp updates

## Using Drizzle in Your Code

### Import Database
```typescript
import { db } from './src/db';
import { restaurants, menuItems } from './src/db/schema';
```

### Query Examples
```typescript
// Get all restaurants
const allRestaurants = await db.select().from(restaurants);

// Get menu items for a restaurant
const menuItems = await db
  .select()
  .from(menuItems)
  .where(eq(menuItems.restaurantId, restaurantId));

// Insert new restaurant
const newRestaurant = await db
  .insert(restaurants)
  .values({
    name: 'New Restaurant',
    slug: 'new-restaurant',
    description: 'A great place to eat'
  })
  .returning();
```

## Drizzle Studio

Drizzle Studio provides a web-based GUI for your database:

```bash
npm run db:studio
```

This opens a web interface where you can:
- Browse tables and data
- Run queries
- Edit records
- View relationships

## Migration Workflow

### Making Schema Changes
1. Update `src/db/schema.ts`
2. Run `npm run db:push` for development
3. Or generate migrations with `npm run db:generate`
4. Apply migrations with `npm run db:migrate`

### Example Schema Change
```typescript
// Add new column to restaurants table
export const restaurants = pgTable('restaurants', {
  // ... existing columns
  newField: varchar('new_field', { length: 100 }), // New column
});
```

## Deployment to Vercel

### 1. Update Vercel Configuration
Your `vercel.json` is already configured correctly.

### 2. Set Environment Variables
Add all environment variables in Vercel dashboard.

### 3. Deploy
```bash
vercel
```

### 4. Push Schema to Production
After deployment, push your schema to the production database:
```bash
NODE_ENV=production npm run db:push
```

## Troubleshooting

### Connection Issues
- Verify your Neon connection details
- Check if SSL is required (usually yes for Neon)
- Ensure your IP is whitelisted (if applicable)

### Schema Issues
- Check Drizzle configuration in `drizzle.config.ts`
- Verify schema definitions in `src/db/schema.ts`
- Review migration files in `drizzle/` directory

### Type Issues
- Ensure TypeScript is properly configured
- Check import paths in your code
- Verify schema exports

## Benefits of Drizzle ORM

1. **Type Safety**: Full TypeScript support with auto-completion
2. **Performance**: Lightweight and fast
3. **Developer Experience**: Excellent tooling and debugging
4. **Schema Management**: Version control for database changes
5. **Migration Support**: Safe database updates
6. **Studio GUI**: Visual database management

## Next Steps

1. **Update Routes**: Migrate your existing routes to use Drizzle
2. **Add Validation**: Implement request validation
3. **Add Tests**: Create unit tests for your database operations
4. **Monitor Performance**: Use Drizzle Studio to monitor queries
5. **Set up CI/CD**: Automate schema migrations in deployment

## Support

If you encounter issues:
1. Check Drizzle documentation: [orm.drizzle.team](https://orm.drizzle.team)
2. Review Neon documentation: [neon.tech/docs](https://neon.tech/docs)
3. Check Vercel deployment logs
4. Test database connection locally first
