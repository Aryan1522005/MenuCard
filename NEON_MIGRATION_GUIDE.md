# Database Migration Guide: MySQL to Neon PostgreSQL

## Overview
This guide will help you migrate your QR Menu System from local MySQL to Neon PostgreSQL database for Vercel deployment.

## Prerequisites
- Neon account (free tier available at [neon.tech](https://neon.tech))
- Node.js installed locally
- Your existing MySQL database running

## Step 1: Set Up Neon Database

### 1.1 Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project

### 1.2 Get Connection Details
1. In your Neon dashboard, go to "Connection Details"
2. Copy the following information:
   - Host
   - Database name
   - Username
   - Password
   - Port (usually 5432)

### 1.3 Create Database Schema
1. In Neon dashboard, go to "SQL Editor"
2. Copy and paste the contents of `backend/database/postgresql-schema.sql`
3. Execute the script to create all tables and sample data

## Step 2: Install PostgreSQL Driver

```bash
cd backend
npm install pg
npm uninstall mysql2  # Remove MySQL driver
```

## Step 3: Configure Environment Variables

### 3.1 Create .env file
Create a `.env` file in the `backend` directory:

```env
# Neon PostgreSQL Configuration
DB_HOST=your-neon-host.neon.tech
DB_PORT=5432
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database-name

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-key-here
```

### 3.2 For Vercel Deployment
Add these environment variables in your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all the variables from your `.env` file

## Step 4: Migrate Existing Data (Optional)

If you have existing data in your MySQL database:

### 4.1 Install MySQL driver temporarily
```bash
npm install mysql2
```

### 4.2 Configure migration script
Update `backend/scripts/migrate-to-postgresql.js` with your MySQL credentials:

```env
# Add to your .env file
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=qr_menu_system
```

### 4.3 Run migration
```bash
node backend/scripts/migrate-to-postgresql.js
```

### 4.4 Remove MySQL driver
```bash
npm uninstall mysql2
```

## Step 5: Test Database Connection

### 5.1 Test locally
```bash
cd backend
node -e "require('./config/database').testConnection()"
```

### 5.2 Test server startup
```bash
npm run dev
```

## Step 6: Deploy to Vercel

### 6.1 Update Vercel Configuration
Your `vercel.json` is already configured correctly.

### 6.2 Deploy
```bash
# From project root
vercel

# Or push to GitHub and deploy via Vercel dashboard
git add .
git commit -m "Migrate to Neon PostgreSQL"
git push
```

## Step 7: Verify Deployment

1. Check your Vercel deployment logs
2. Test the API endpoints:
   - `https://your-app.vercel.app/api/health`
   - `https://your-app.vercel.app/api/menu/restaurants`

## Key Changes Made

### Database Configuration (`backend/config/database.js`)
- ✅ Switched from `mysql2` to `pg` (PostgreSQL driver)
- ✅ Updated connection pool configuration
- ✅ Added SSL support for production
- ✅ Updated connection testing

### Package Dependencies (`backend/package.json`)
- ✅ Replaced `mysql2` with `pg`
- ✅ Added PostgreSQL driver

### Schema Migration (`backend/database/postgresql-schema.sql`)
- ✅ Converted MySQL syntax to PostgreSQL
- ✅ Added proper constraints and indexes
- ✅ Included all tables: restaurants, categories, menu_items, users, feedback
- ✅ Added sample data
- ✅ Created triggers for automatic timestamp updates

### Migration Script (`backend/scripts/migrate-to-postgresql.js`)
- ✅ Automated data migration from MySQL to PostgreSQL
- ✅ Handles all table types and relationships
- ✅ Includes conflict resolution

## Troubleshooting

### Connection Issues
- Verify your Neon connection details
- Check if SSL is required (usually yes for Neon)
- Ensure your IP is whitelisted (if applicable)

### Migration Issues
- Check MySQL connection details
- Verify PostgreSQL schema is created
- Review error logs for specific table issues

### Deployment Issues
- Verify environment variables in Vercel
- Check build logs for missing dependencies
- Ensure all files are committed to Git

## Benefits of Neon PostgreSQL

1. **Serverless**: Scales automatically
2. **Free Tier**: Generous free usage limits
3. **Vercel Integration**: Seamless deployment
4. **Performance**: Better performance than traditional databases
5. **Reliability**: Built-in backups and high availability

## Support

If you encounter issues:
1. Check Neon documentation: [neon.tech/docs](https://neon.tech/docs)
2. Review Vercel deployment logs
3. Test database connection locally first
4. Verify all environment variables are set correctly

## Next Steps

After successful migration:
1. Update your frontend to use the new Vercel URL
2. Test all functionality thoroughly
3. Monitor performance and costs
4. Set up monitoring and alerts
