const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const multer = require('multer');
const XLSX = require('xlsx');
const { verifyToken } = require('../middleware/auth-database');
const { canManageMenu } = require('../middleware/permissions');

// Multer setup for Excel uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// GET /api/menu/:slug - Get menu items for a restaurant
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Get restaurant info
    const [restaurantRows] = await pool.query(
      'SELECT * FROM restaurants WHERE slug = $1',
      [slug]
    );
    
    if (!restaurantRows || restaurantRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found' 
      });
    }
    
    const restaurant = restaurantRows[0];
    
    // Get categories with images
    const [categoryRows] = await pool.query(
      'SELECT id, name, image_url FROM categories WHERE restaurant_id = $1 ORDER BY id ASC',
      [restaurant.id]
    );
    
    const categoryMap = {};
    const categoryOrder = [];
    categoryRows.forEach(cat => {
      categoryMap[cat.name] = {
        id: cat.id,
        image_url: cat.image_url
      };
      categoryOrder.push(cat.name);
    });
    
    // Get menu items grouped by category
    // Always include is_veg since we're using PostgreSQL with the column
    const selectQuery = `
      SELECT 
        category,
        id,
        name,
        description,
        price,
        is_available,
        sort_order,
        item_code,
        COALESCE(is_veg, true) as is_veg
      FROM menu_items 
      WHERE restaurant_id = ? AND is_available = true
      ORDER BY sort_order, item_code
    `;
    
    const [menuRows] = await pool.query(selectQuery, [restaurant.id]);
    
    // Group items by category using predefined category order
    const categories = {};
    
    // Initialize categories in the correct order
    categoryOrder.forEach(categoryName => {
      categories[categoryName] = [];
    });
    
    // Add items to their respective categories
    menuRows.forEach(item => {
      if (categories[item.category]) {
        categories[item.category].push({
          id: item.id,
          name: item.name,
          description: item.description,
          price: parseFloat(item.price),
          is_available: item.is_available,
          item_code: item.item_code,
          is_veg: item.is_veg
        });
      }
    });
    
    res.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logo_url: restaurant.logo_url,
        image_url: restaurant.image_url,
        description: restaurant.description,
        address: restaurant.address,
        phone: restaurant.phone,
        wifi_name: restaurant.wifi_name,
        wifi_password: restaurant.wifi_password,
        custom_sections: restaurant.custom_sections ? JSON.parse(restaurant.custom_sections) : null
      },
      categories,
      categoryMeta: categoryMap,
      categoryOrder
    });
    
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// POST /api/menu/add - Add new menu item
router.post('/add', verifyToken, canManageMenu, async (req, res) => {
  try {
    const { 
      restaurant_id, 
      category, 
      name, 
      description, 
      price, 
      image_url,
      availability_time,
      is_available = true,
      sort_order = 0,
      is_veg
    } = req.body;
    
    // Validate required fields
    if (!restaurant_id || !category || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Compute the next item_code for this restaurant (starting at 1)
    const [maxRows] = await pool.query(
      'SELECT COALESCE(MAX(item_code), 0) AS max_code FROM menu_items WHERE restaurant_id = ?',
      [restaurant_id]
    );
    const nextItemCode = Number(maxRows[0].max_code || 0) + 1;

    // Check if is_veg column exists
    let insertQuery = `
      INSERT INTO menu_items 
      (restaurant_id, category, name, description, price, availability_time, is_available, sort_order, item_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    let insertParams = [restaurant_id, category, name, description, price, availability_time || null, !!is_available, sort_order, nextItemCode];
    
    try {
      const [checkColumn] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'menu_items' 
        AND COLUMN_NAME = 'is_veg'
      `);
      
      if (checkColumn.length > 0) {
        insertQuery = `
          INSERT INTO menu_items 
          (restaurant_id, category, name, description, price, availability_time, is_available, sort_order, item_code, is_veg)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        insertParams.push(is_veg !== undefined ? is_veg : null);
      }
    } catch (e) {
      console.log('is_veg column check failed, using basic insert');
    }
    
    // Insert new menu item
    const [result] = await pool.query(insertQuery, insertParams);
    
    res.json({
      success: true,
      message: 'Menu item added successfully',
      item_id: result.insertId
    });
    
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// DELETE /api/menu/:id - Delete menu item
router.delete('/:id', verifyToken, canManageMenu, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if item exists
    const [rows] = await pool.query(
      'SELECT id FROM menu_items WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }
    
    // Delete item
    await pool.query(
      'DELETE FROM menu_items WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// PUT /api/menu/:id - Update menu item
router.put('/:id', verifyToken, canManageMenu, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, name, description, price, is_available, preparation_time, is_veg } = req.body;

    // Load existing item
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const current = rows[0];
    const newCategory = category ?? current.category;
    const newName = name ?? current.name;
    const newDescription = description ?? current.description;
    const newPrice = (price !== undefined && price !== null && price !== '') ? price : current.price;
    const newIsAvailable = (typeof is_available === 'boolean') ? is_available : current.is_available;
    const newPrepTime = preparation_time ?? current.availability_time; // keep same column used earlier for time window
    const newIsVeg = is_veg !== undefined ? is_veg : (current.is_veg ?? null);

    // Check if is_veg column exists
    let updateQuery = `UPDATE menu_items 
       SET category = ?, name = ?, description = ?, price = ?, is_available = ?, availability_time = ?
       WHERE id = ?`;
    let updateParams = [newCategory, newName, newDescription, newPrice, newIsAvailable, newPrepTime, id];
    
    try {
      const [checkColumn] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'menu_items' 
        AND COLUMN_NAME = 'is_veg'
      `);
      
      if (checkColumn.length > 0) {
        updateQuery = `UPDATE menu_items 
         SET category = ?, name = ?, description = ?, price = ?, is_available = ?, availability_time = ?, is_veg = ?
         WHERE id = ?`;
        updateParams = [newCategory, newName, newDescription, newPrice, newIsAvailable, newPrepTime, newIsVeg, id];
      }
    } catch (e) {
      console.log('is_veg column check failed, using basic update');
    }

    await pool.query(updateQuery, updateParams);
    
    res.json({
      success: true,
      message: 'Menu item updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// GET /api/menu/:slug/search - Search all menu items across all categories for a restaurant
router.get('/:slug/search', async (req, res) => {
  try {
    const { slug } = req.params;
    const { q: searchTerm } = req.query;
    
    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }
    
    // Get restaurant info
    const [restaurantRows] = await pool.query(
      'SELECT * FROM restaurants WHERE slug = ?',
      [slug]
    );
    
    if (restaurantRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found' 
      });
    }
    
    const restaurant = restaurantRows[0];
    
    // Search menu items across all categories
    // Check if is_veg column exists for backward compatibility
    let searchQuery = `
      SELECT 
        category,
        id,
        name,
        description,
        price,
        is_available,
        sort_order,
        item_code
      FROM menu_items 
      WHERE restaurant_id = ? 
        AND is_available = true
        AND (
          name LIKE ? OR 
          description LIKE ? OR 
          category LIKE ?
        )
      ORDER BY category, sort_order, item_code
    `;
    
    try {
      const [checkColumn] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'menu_items' 
        AND COLUMN_NAME = 'is_veg'
      `);
      
      if (checkColumn.length > 0) {
        searchQuery = `
          SELECT 
            category,
            id,
            name,
            description,
            price,
            is_available,
            sort_order,
            item_code,
            is_veg
          FROM menu_items 
          WHERE restaurant_id = ? 
            AND is_available = true
            AND (
              name LIKE ? OR 
              description LIKE ? OR 
              category LIKE ?
            )
          ORDER BY category, sort_order, item_code
        `;
      }
    } catch (e) {
      console.log('is_veg column check failed in search');
    }
    
    const [menuRows] = await pool.query(searchQuery, [restaurant.id, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    
    // Group items by category
    const categories = {};
    menuRows.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price),
        is_available: item.is_available,
        item_code: item.item_code,
        is_veg: item.is_veg
      });
    });
    
    res.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logo_url: restaurant.logo_url,
        image_url: restaurant.image_url,
        description: restaurant.description,
        address: restaurant.address,
        phone: restaurant.phone,
        wifi_name: restaurant.wifi_name,
        wifi_password: restaurant.wifi_password,
        custom_sections: restaurant.custom_sections ? JSON.parse(restaurant.custom_sections) : null
      },
      categories,
      searchTerm: searchTerm.trim(),
      totalResults: menuRows.length
    });
    
  } catch (error) {
    console.error('Error searching menu:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// GET /api/menu/:slug/category/:categoryName/search - Search items within a specific category
router.get('/:slug/category/:categoryName/search', async (req, res) => {
  try {
    const { slug, categoryName } = req.params;
    const { q: searchTerm } = req.query;
    
    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }
    
    // Get restaurant info
    const [restaurantRows] = await pool.query(
      'SELECT * FROM restaurants WHERE slug = ?',
      [slug]
    );
    
    if (restaurantRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found' 
      });
    }
    
    const restaurant = restaurantRows[0];
    
    // Search menu items within specific category
    // Check if is_veg column exists for backward compatibility
    let categorySearchQuery = `
      SELECT 
        category,
        id,
        name,
        description,
        price,
        is_available,
        sort_order,
        item_code
      FROM menu_items 
      WHERE restaurant_id = ? 
        AND category = ?
        AND is_available = true
        AND (
          name LIKE ? OR 
          description LIKE ?
        )
      ORDER BY sort_order, item_code
    `;
    
    try {
      const [checkColumn] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'menu_items' 
        AND COLUMN_NAME = 'is_veg'
      `);
      
      if (checkColumn.length > 0) {
        categorySearchQuery = `
          SELECT 
            category,
            id,
            name,
            description,
            price,
            is_available,
            sort_order,
            item_code,
            is_veg
          FROM menu_items 
          WHERE restaurant_id = ? 
            AND category = ?
            AND is_available = true
            AND (
              name LIKE ? OR 
              description LIKE ?
            )
          ORDER BY sort_order, item_code
        `;
      }
    } catch (e) {
      console.log('is_veg column check failed in category search');
    }
    
    const [menuRows] = await pool.query(categorySearchQuery, [restaurant.id, categoryName, `%${searchTerm}%`, `%${searchTerm}%`]);
    
    res.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logo_url: restaurant.logo_url,
        image_url: restaurant.image_url,
        description: restaurant.description,
        address: restaurant.address,
        phone: restaurant.phone,
        wifi_name: restaurant.wifi_name,
        wifi_password: restaurant.wifi_password,
        custom_sections: restaurant.custom_sections ? JSON.parse(restaurant.custom_sections) : null
      },
      category: categoryName,
      items: menuRows.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price),
        is_available: item.is_available,
        item_code: item.item_code,
        is_veg: item.is_veg
      })),
      searchTerm: searchTerm.trim(),
      totalResults: menuRows.length
    });
    
  } catch (error) {
    console.error('Error searching category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;

// Bulk import menu items from Excel
// Expects multipart/form-data with fields: restaurant_id, category_name or category_id, and file (xlsx/xls)
router.post('/bulk-import', verifyToken, canManageMenu, upload.single('file'), async (req, res) => {
  try {
    console.log('[IMPORT] received request', {
      hasFile: !!req.file,
      size: req.file ? req.file.size : 0,
      restaurant_id: req.body && req.body.restaurant_id,
      category_id: req.body && req.body.category_id,
      category_name: req.body && req.body.category_name,
    });
    const { restaurant_id, category_name, category_id } = req.body;
    if (!restaurant_id) {
      return res.status(400).json({ success: false, message: 'restaurant_id is required' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Excel file is required (field name "file")' });
    }

    // Resolve category name
    let resolvedCategoryName = category_name;
    if (!resolvedCategoryName && category_id) {
      const [rows] = await pool.query('SELECT name FROM categories WHERE id = ? AND restaurant_id = ?', [category_id, restaurant_id]);
      if (rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid category_id for this restaurant' });
      }
      resolvedCategoryName = rows[0].name;
    }
    if (!resolvedCategoryName) {
      return res.status(400).json({ success: false, message: 'category_name or category_id is required' });
    }

    // Parse workbook
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const ws = workbook.Sheets[sheetName];
    // Use two representations: object rows and array rows (for robust header detection)
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows found in Excel' });
    }

    // Expected columns (case-insensitive): name, description, price, is_available
    // Normalize header names to be tolerant to spaces/underscores/case
    const normalizeHeader = (h) => String(h || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    // Prefer headers from the first row of the sheet; fallback to object keys
    const headerRow = Array.isArray(aoa) && aoa.length ? aoa[0] : [];
    const headerMap = (headerRow.length ? headerRow : Object.keys(rows[0] || {})).reduce((acc, key) => {
      acc[normalizeHeader(key)] = String(key);
      return acc;
    }, {});

    const getField = (row, candidates) => {
      for (const c of candidates) {
        const normalized = normalizeHeader(c);
        const actual = headerMap[normalized];
        if (actual && Object.prototype.hasOwnProperty.call(row, actual)) {
          const val = row[actual];
          if (val !== undefined) return val;
        }
        if (Object.prototype.hasOwnProperty.call(row, c)) {
          const val = row[c];
          if (val !== undefined) return val;
        }
      }
      return undefined;
    };

    const toBool = (v) => {
      const s = String(v).trim().toLowerCase();
      if (['1', 'true', 'yes', 'y'].includes(s)) return true;
      if (['0', 'false', 'no', 'n'].includes(s)) return false;
      return true;
    };

    // Compute next item_code start
    const [maxRows] = await pool.query(
      'SELECT COALESCE(MAX(item_code), 0) AS max_code FROM menu_items WHERE restaurant_id = ?',
      [restaurant_id]
    );
    let itemCodeCounter = Number(maxRows[0].max_code || 0);

    const insertValues = [];
    const errors = [];
    for (const [index, r] of rows.entries()) {
      // Skip fully blank rows
      const values = Object.values(r).map(v => String(v).trim());
      const isBlank = values.length === 0 || values.every(v => v === '');
      if (isBlank) continue;

      const name = getField(r, ['name', 'Name', 'item', 'Item']) || '';
      const description = getField(r, ['description', 'Description', 'desc']) || '';
      const priceRaw = getField(r, ['price', 'Price', 'rate', 'mrp', 'cost']) || '';
      const availRaw = getField(r, ['is_available', 'available', 'Available']);
      const is_available = (availRaw === undefined || String(availRaw).trim() === '') ? true : toBool(availRaw);
      
      // Get veg/non-veg field (0 = veg, 1 = non-veg)
      const vegRaw = getField(r, ['veg', 'Veg', 'is_veg', 'food_type', 'type']);
      let is_veg = null;
      if (vegRaw !== undefined && String(vegRaw).trim() !== '') {
        const vegStr = String(vegRaw).trim().toLowerCase();
        if (vegStr === '0' || vegStr === 'veg' || vegStr === 'vegetarian') {
          is_veg = true; // 0 means veg
        } else if (vegStr === '1' || vegStr === 'non-veg' || vegStr === 'nonveg' || vegStr === 'non vegetarian') {
          is_veg = false; // 1 means non-veg
        }
      }

      // Sanitize price: allow numbers like "₹120", "120/-", "1,299.00"
      const sanitized = String(priceRaw).replace(/[,\s]/g, '').replace(/[^0-9.\-]/g, '');
      const price = parseFloat(sanitized);
      if (!name || isNaN(price)) {
        errors.push({ row: index + 2, reason: 'Missing name or invalid price', debug: { name, priceRaw } });
        continue;
      }
      itemCodeCounter += 1;
      insertValues.push([
        restaurant_id,
        resolvedCategoryName,
        name,
        description,
        price,
        null, // availability_time
        is_available,
        0, // sort_order
        itemCodeCounter,
        is_veg,
      ]);
    }

    if (insertValues.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid rows to insert', errors });
    }

    // Check if is_veg column exists before inserting
    let insertQuery = `INSERT INTO menu_items 
      (restaurant_id, category, name, description, price, availability_time, is_available, sort_order, item_code)
      VALUES ?`;
    
    try {
      const [checkColumn] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'menu_items' 
        AND COLUMN_NAME = 'is_veg'
      `);
      
      if (checkColumn.length > 0) {
        insertQuery = `INSERT INTO menu_items 
          (restaurant_id, category, name, description, price, availability_time, is_available, sort_order, item_code, is_veg)
          VALUES ?`;
      } else {
        // Remove is_veg from insertValues if column doesn't exist
        insertValues.forEach(row => row.pop());
      }
    } catch (e) {
      console.log('is_veg column check failed, using basic insert');
      insertValues.forEach(row => row.pop());
    }
    
    await pool.query(insertQuery, [insertValues]);

    console.log('[IMPORT] inserting rows', insertValues.length, 'skipped', errors.length);
    res.json({ success: true, inserted: insertValues.length, skipped: errors.length, errors });
  } catch (error) {
    console.error('Bulk import failed:', error);
    res.status(500).json({ success: false, message: 'Bulk import failed', error: error.message });
  }
});

// Bulk import menu items from CSV (minimal headers: name,price)
// Expects multipart/form-data with: restaurant_id, category_name or category_id, file (.csv)
router.post('/bulk-import-csv', verifyToken, canManageMenu, upload.single('file'), async (req, res) => {
  try {
    const { restaurant_id, category_name, category_id } = req.body;
    if (!restaurant_id) return res.status(400).json({ success: false, message: 'restaurant_id is required' });
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file is required (field name "file")' });

    // Resolve category name
    let resolvedCategoryName = category_name;
    if (!resolvedCategoryName && category_id) {
      const [rows] = await pool.query('SELECT name FROM categories WHERE id = ? AND restaurant_id = ?', [category_id, restaurant_id]);
      if (rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid category_id for this restaurant' });
      resolvedCategoryName = rows[0].name;
    }
    if (!resolvedCategoryName) return res.status(400).json({ success: false, message: 'category_name or category_id is required' });

    // Parse CSV (minimal, expects simple name,price without embedded commas)
    const text = req.file.buffer.toString('utf8');
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return res.status(400).json({ success: false, message: 'CSV is empty' });
    const headers = lines[0].split(',').map(h => h.trim());
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = (parts[j] || '').trim();
      }
      records.push(obj);
    }
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows found in CSV' });
    }

    const norm = (s) => String(s || '').trim().toLowerCase();

    // Compute next item_code start
    const [maxRows] = await pool.query(
      'SELECT COALESCE(MAX(item_code), 0) AS max_code FROM menu_items WHERE restaurant_id = ?',
      [restaurant_id]
    );
    let itemCodeCounter = Number(maxRows[0].max_code || 0);

    const insertValues = [];
    const errors = [];
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const name = r.name || r.Name || r.item || r.Item || '';
      const priceRaw = r.price || r.Price || r.rate || '';
      const description = r.description || r.Description || '';
      const is_available = true;
      
      // Get veg/non-veg field (0 = veg, 1 = non-veg)
      const vegRaw = r.veg || r.Veg || r.is_veg || r.food_type || r.type || '';
      let is_veg = null;
      if (vegRaw && String(vegRaw).trim() !== '') {
        const vegStr = String(vegRaw).trim().toLowerCase();
        if (vegStr === '0' || vegStr === 'veg' || vegStr === 'vegetarian') {
          is_veg = true; // 0 means veg
        } else if (vegStr === '1' || vegStr === 'non-veg' || vegStr === 'nonveg' || vegStr === 'non vegetarian') {
          is_veg = false; // 1 means non-veg
        }
      }

      const price = parseFloat(String(priceRaw).replace(/[\,\s]/g, '').replace(/[^0-9.\-]/g, ''));
      if (!name || isNaN(price)) {
        errors.push({ row: i + 2, reason: 'Missing name or invalid price' });
        continue;
      }
      itemCodeCounter += 1;
      insertValues.push([
        restaurant_id,
        resolvedCategoryName,
        name,
        description || '',
        price,
        null,
        is_available,
        0,
        itemCodeCounter,
        is_veg,
      ]);
    }

    if (insertValues.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid rows to insert', errors });
    }

    // Check if is_veg column exists before inserting
    let insertQuery = `INSERT INTO menu_items 
      (restaurant_id, category, name, description, price, availability_time, is_available, sort_order, item_code)
      VALUES ?`;
    
    try {
      const [checkColumn] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'menu_items' 
        AND COLUMN_NAME = 'is_veg'
      `);
      
      if (checkColumn.length > 0) {
        insertQuery = `INSERT INTO menu_items 
          (restaurant_id, category, name, description, price, availability_time, is_available, sort_order, item_code, is_veg)
          VALUES ?`;
      } else {
        // Remove is_veg from insertValues if column doesn't exist
        insertValues.forEach(row => row.pop());
      }
    } catch (e) {
      console.log('is_veg column check failed, using basic insert');
      insertValues.forEach(row => row.pop());
    }
    
    await pool.query(insertQuery, [insertValues]);

    res.json({ success: true, inserted: insertValues.length, skipped: errors.length, errors });
  } catch (error) {
    console.error('Bulk CSV import failed:', error);
    res.status(500).json({ success: false, message: 'Bulk CSV import failed', error: error.message });
  }
});
