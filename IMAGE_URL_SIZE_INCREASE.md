# Image URL Size Increase Migration

## Summary
Successfully increased the character limit for image URL fields from **VARCHAR(500)** to **TEXT** to support very long URLs (thousands of characters).

## Changes Made

### Database Schema Updates
1. **restaurants.logo_url**: VARCHAR(500) → TEXT
2. **categories.image_url**: VARCHAR(500) → TEXT  
3. **menu_items.image_url**: VARCHAR(500) → TEXT

### Files Modified
1. `backend/database/postgresql-schema.sql` - Updated schema for new databases
2. `backend/database/add-category-columns-postgres.sql` - Updated migration script
3. `backend/database/increase-image-url-size.sql` - New SQL migration
4. `backend/scripts/increase-image-url-size.js` - New Node.js migration script
5. `backend/package.json` - Added new npm script: `npm run increase-image-url-size`

## Migration Applied
✅ **Migration successfully applied to database on October 27, 2025**

The following tables were updated:
- ✅ restaurants.logo_url → TEXT
- ✅ categories.image_url → TEXT  
- ✅ menu_items.image_url → TEXT

## How to Run Migration

If you need to apply this migration to another database:

```bash
cd backend
npm run increase-image-url-size
```

This will:
1. Connect to the PostgreSQL database
2. Alter the image URL columns from VARCHAR(500) to TEXT
3. Support URLs of any length

## Benefits
- ✅ No character limit restrictions on image URLs
- ✅ Support for very long URLs (CDN links, signed URLs, etc.)
- ✅ Better compatibility with modern image hosting services
- ✅ Future-proof for growing URL requirements

## Backward Compatibility
✅ **Fully backward compatible** - Existing data remains intact, just the field type changed to support longer URLs.

