const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const QRGenerator = require('../utils/qrGenerator');
const { verifyToken } = require('../middleware/auth-database');
const { requireAdmin, requireManager, requireViewer, canDeleteRestaurant, canManageMenu, canAddRestaurant } = require('../middleware/permissions');

const qrGenerator = new QRGenerator();

// Apply authentication middleware to all admin routes
router.use(verifyToken);

// GET /api/admin/restaurants - Get all restaurants with optional search
router.get('/restaurants', requireViewer, async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
        r.*,
        COUNT(CASE WHEN mi.is_available = 1 THEN mi.id END) as menu_item_count
      FROM restaurants r
      LEFT JOIN menu_items mi ON r.id = mi.restaurant_id
    `;
    
    let params = [];
    
    if (search) {
      query += ` WHERE r.id = ? OR r.name LIKE ? OR r.slug LIKE ?`;
      params = [search, `%${search}%`, `%${search}%`];
    }
    
    query += ` GROUP BY r.id ORDER BY r.id ASC`;
    
    const [rows] = await pool.query(query, params);
    
    res.json({
      success: true,
      restaurants: rows
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// GET /api/admin/restaurants/:id - Get restaurant with menu items
router.get('/restaurants/:id', requireViewer, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get restaurant info
    const [restaurantRows] = await pool.query(
      'SELECT * FROM restaurants WHERE id = ?',
      [id]
    );
    
    if (restaurantRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    const restaurant = restaurantRows[0];
    
    // Get menu items grouped by category
    const [menuRows] = await pool.query(`
      SELECT 
        category,
        id,
        name,
        description,
        price,
        image_url,
        is_available,
        sort_order,
        item_code
      FROM menu_items 
      WHERE restaurant_id = ?
      ORDER BY category, sort_order, item_code
    `, [id]);
    
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
        image_url: item.image_url,
        is_available: item.is_available,
        sort_order: item.sort_order,
        item_code: item.item_code
      });
    });
    
    res.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logo_url: restaurant.logo_url,
        description: restaurant.description
      },
      categories
    });
    
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// POST /api/admin/restaurants - Create new restaurant
router.post('/restaurants', canAddRestaurant, async (req, res) => {
  try {
    const { 
      name, slug, logo_url, image_url, description,
      address, phone, wifi_name, wifi_password, custom_sections
    } = req.body;
    
    // Validate required fields
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name and slug are required'
      });
    }
    
    // Check if slug already exists
    const [existingRows] = await pool.query(
      'SELECT id FROM restaurants WHERE slug = ?',
      [slug]
    );
    
    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant with this slug already exists'
      });
    }
    
    // Prepare custom_sections JSON
    const customSectionsJson = custom_sections ? JSON.stringify(custom_sections) : null;
    
    // Insert new restaurant
    const [result] = await pool.query(`
      INSERT INTO restaurants (
        name, slug, logo_url, image_url, description,
        address, phone, wifi_name, wifi_password, custom_sections
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, slug, logo_url, image_url || null, description,
      address || null, phone || null, wifi_name || null, 
      wifi_password || null, customSectionsJson
    ]);
    
    res.json({
      success: true,
      message: 'Restaurant created successfully',
      restaurant_id: result.insertId
    });
    
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// PUT /api/admin/restaurants/:id - Update restaurant
router.put('/restaurants/:id', requireViewer, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, slug, logo_url, image_url, description,
      address, phone, wifi_name, wifi_password, custom_sections
    } = req.body;
    
    // Check if restaurant exists
    const [existingRows] = await pool.query(
      'SELECT * FROM restaurants WHERE id = ?',
      [id]
    );
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    const current = existingRows[0];
    
    // If slug is being changed, check if new slug already exists
    if (slug && slug !== current.slug) {
      const [slugCheck] = await pool.query(
        'SELECT id FROM restaurants WHERE slug = ? AND id != ?',
        [slug, id]
      );
      
      if (slugCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Restaurant with this slug already exists'
        });
      }
    }
    
    // Prepare custom_sections JSON
    let customSectionsJson = current.custom_sections;
    if (custom_sections !== undefined) {
      customSectionsJson = custom_sections ? JSON.stringify(custom_sections) : null;
    }
    
    // Update restaurant
    await pool.query(`
      UPDATE restaurants 
      SET name = ?, slug = ?, logo_url = ?, image_url = ?, description = ?,
          address = ?, phone = ?, wifi_name = ?, wifi_password = ?, custom_sections = ?
      WHERE id = ?
    `, [
      name || current.name,
      slug || current.slug,
      logo_url !== undefined ? logo_url : current.logo_url,
      image_url !== undefined ? image_url : current.image_url,
      description !== undefined ? description : current.description,
      address !== undefined ? address : current.address,
      phone !== undefined ? phone : current.phone,
      wifi_name !== undefined ? wifi_name : current.wifi_name,
      wifi_password !== undefined ? wifi_password : current.wifi_password,
      customSectionsJson,
      id
    ]);
    
    res.json({
      success: true,
      message: 'Restaurant updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// GET /api/admin/qr/:slug - Generate QR code for restaurant
router.get('/qr/:slug', requireViewer, async (req, res) => {
  try {
    const { slug } = req.params;
    const { size = 200, margin = 2 } = req.query;
    
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
    const frontendUrl = 'http://192.168.1.106:3000';
    
    // Generate QR code
    const qrData = await qrGenerator.generateRestaurantQR(restaurant, frontendUrl);
    
    res.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug
      },
      menu_url: qrData.menuUrl,
      qr_code: qrData.dataURL,
      download_url: `/api/qr/${slug}/download`
    });
    
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// GET /api/admin/qr/:slug/download - Download QR code as PNG
router.get('/qr/:slug/download', requireViewer, async (req, res) => {
  try {
    const { slug } = req.params;
    
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
    const frontendUrl = 'http://192.168.1.106:3000';
    
    // Generate QR code file
    const qrData = await qrGenerator.generateRestaurantQR(restaurant, frontendUrl);
    
    // Send file
    res.download(qrData.filePath, qrData.filename);
    
  } catch (error) {
    console.error('Error downloading QR code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// DANGEROUS: Delete ALL menu items and ALL categories
router.delete('/wipe-menu', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM menu_items');
    await pool.query('DELETE FROM categories');
    res.json({ success: true, message: 'All menu items and categories deleted' });
  } catch (error) {
    console.error('Error wiping menu data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/restaurants/:id - Delete a restaurant and its menu
router.delete('/restaurants/:id', canDeleteRestaurant, async (req, res) => {
  try {
    const { id } = req.params;

    // Check existence
    const [rows] = await pool.query('SELECT id FROM restaurants WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Deleting restaurant will cascade delete menu_items due to FK
    await pool.query('DELETE FROM restaurants WHERE id = ?', [id]);
    res.json({ success: true, message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/restaurants/:id/reset-menu - Delete this restaurant's categories and items and reset IDs
router.post('/restaurants/:id/reset-menu', canDeleteRestaurant, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    // Ensure restaurant exists
    const [rows] = await connection.execute('SELECT id FROM restaurants WHERE id = ?', [id]);
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    await connection.beginTransaction();

    // Delete menu items and categories for this restaurant
    await connection.execute('DELETE FROM menu_items WHERE restaurant_id = ?', [id]);
    await connection.execute('DELETE FROM categories WHERE restaurant_id = ?', [id]);

    // Reset AUTO_INCREMENT for dependent tables globally (safe even if other restaurants exist)
    await connection.execute('ALTER TABLE menu_items AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE categories AUTO_INCREMENT = 1');

    await connection.commit();
    res.json({ success: true, message: 'Restaurant menu reset. Items and categories deleted and IDs reset to 1.' });
  } catch (error) {
    try { await (connection && connection.rollback()); } catch (_) {}
    console.error('Error resetting restaurant menu:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/admin/reset-all - Delete ALL data and reset auto-increment IDs
// WARNING: This is a destructive operation!
router.post('/reset-all', requireAdmin, async (req, res) => {
  try {
    // Disable foreign key checks temporarily
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Delete all data
    await pool.query('DELETE FROM menu_items');
    await pool.query('DELETE FROM restaurants');
    await pool.query('DELETE FROM categories');
    
    // Reset auto-increment counters to 1
    await pool.query('ALTER TABLE restaurants AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE menu_items AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE categories AUTO_INCREMENT = 1');
    
    // Re-enable foreign key checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    
    res.json({ 
      success: true, 
      message: 'All data deleted and auto-increment counters reset to 1' 
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/admin/menu-items/search - Search menu items by various criteria
router.get('/menu-items/search', canManageMenu, async (req, res) => {
  try {
    const { restaurant_id, search } = req.query;
    
    if (!restaurant_id) {
      return res.status(400).json({
        success: false,
        message: 'restaurant_id is required'
      });
    }
    
    let query = `
      SELECT 
        mi.*,
        r.name as restaurant_name,
        r.slug as restaurant_slug
      FROM menu_items mi
      JOIN restaurants r ON mi.restaurant_id = r.id
      WHERE mi.restaurant_id = ?
    `;
    
    let params = [restaurant_id];
    
    if (search) {
      query += ` AND (
        mi.name LIKE ? OR 
        mi.description LIKE ? OR 
        mi.category LIKE ? OR 
        mi.item_code = ?
      )`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, search);
    }
    
    query += ` ORDER BY mi.item_code ASC`;
    
    const [rows] = await pool.query(query, params);
    
    res.json({
      success: true,
      items: rows
    });
  } catch (error) {
    console.error('Error searching menu items:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;
