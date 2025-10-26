const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth-database');
const { canManageMenu } = require('../middleware/permissions');

// Get all categories (optionally filtered by restaurant)
router.get('/', async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    
    let query = 'SELECT * FROM categories';
    let params = [];
    
    if (restaurant_id) {
      query += ' WHERE restaurant_id = ?';
      params.push(restaurant_id);
    }
    
    query += ' ORDER BY id ASC';
    
    const [categories] = await pool.execute(query, params);
    
    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Create new category
router.post('/', verifyToken, canManageMenu, async (req, res) => {
  try {
    const { name, description, image_url = null, color = '#667eea', sort_order = 0, restaurant_id } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    if (!restaurant_id) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required'
      });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO categories (restaurant_id, name, description, image_url, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [restaurant_id, name, description, image_url, color, sort_order]
    );
    
    res.json({
      success: true,
      message: 'Category created successfully',
      category: {
        id: result.insertId,
        restaurant_id,
        name,
        description,
        color,
        sort_order
      }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists in this restaurant'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
});

// Update category (and propagate name changes to menu_items)
router.put('/:id', verifyToken, canManageMenu, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { name, description, image_url = null, color, sort_order } = req.body;

    await connection.beginTransaction();

    // Load existing category (need previous name and restaurant for propagation)
    const [existingRows] = await connection.execute('SELECT * FROM categories WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const existing = existingRows[0];
    const newName = name !== undefined && name !== null && name !== '' ? name : existing.name;
    const newDescription = description !== undefined ? description : existing.description;
    const newImageUrl = image_url !== undefined ? image_url : existing.image_url;
    const newColor = color !== undefined ? color : existing.color;
    const newSortOrder = sort_order !== undefined ? sort_order : existing.sort_order;

    // Update the category itself
    await connection.execute(
      'UPDATE categories SET name = ?, description = ?, image_url = ?, color = ?, sort_order = ? WHERE id = ?',
      [newName, newDescription, newImageUrl, newColor, newSortOrder, id]
    );

    // If the name changed, propagate to menu_items
    if (newName !== existing.name) {
      // Update by category_id match OR legacy rows that used only text name
      await connection.execute(
        `UPDATE menu_items 
         SET category = ?, category_id = ?
         WHERE category_id = ? OR (restaurant_id = ? AND category = ?)`,
        [newName, id, id, existing.restaurant_id, existing.name]
      );
    }

    await connection.commit();

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    try { await (connection && connection.rollback()); } catch (_) {}
    console.error('Error updating category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Category with this name already exists in this restaurant' });
    }
    res.status(500).json({ success: false, message: 'Error updating category', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Delete category
router.delete('/:id', verifyToken, canManageMenu, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category is being used by menu items
    const [menuItems] = await pool.execute(
      'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?',
      [id]
    );
    
    if (menuItems[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that is being used by menu items'
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
});

module.exports = router;

