const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { pool } = require('../config/database');

// GET /api/qr/:slug - Generate QR code for restaurant
router.get('/:slug', async (req, res) => {
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
    
    // Generate menu URL (this will be your Firebase hosting URL in production)
    const frontendUrl = 'http://192.168.1.106:3000';
    const menuUrl = `${frontendUrl}/menu/${slug}`;
    
    // Generate QR code
    const qrCodeOptions = {
      width: parseInt(size),
      margin: parseInt(margin),
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    const qrCodeDataURL = await QRCode.toDataURL(menuUrl, qrCodeOptions);
    
    res.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug
      },
      menu_url: menuUrl,
      qr_code: qrCodeDataURL,
      qr_code_options: qrCodeOptions
    });
    
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// GET /api/qr/:slug/download - Download QR code as PNG
router.get('/:slug/download', async (req, res) => {
  try {
    const { slug } = req.params;
    const { size = 400, margin = 4 } = req.query;
    
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
    
    // Generate menu URL
    const frontendUrl = 'http://192.168.1.106:3000';
    const menuUrl = `${frontendUrl}/menu/${slug}`;
    
    // Generate QR code as PNG buffer
    const qrCodeOptions = {
      width: parseInt(size),
      margin: parseInt(margin),
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    const qrCodeBuffer = await QRCode.toBuffer(menuUrl, qrCodeOptions);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${restaurant.name}-qr-code.png"`);
    res.setHeader('Content-Length', qrCodeBuffer.length);
    
    res.send(qrCodeBuffer);
    
  } catch (error) {
    console.error('Error generating QR code for download:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;
