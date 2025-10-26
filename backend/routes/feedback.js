const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth-database');
const { requireAdmin } = require('../middleware/permissions');

// Test endpoint to verify code is updated
router.get('/test-phone', (req, res) => {
  res.json({ 
    message: 'Phone number handling code updated - v2',
    timestamp: new Date().toISOString()
  });
});

// Submit feedback (public route - no auth required)
router.post('/submit', async (req, res) => {
  try {
    const { restaurant_id, phone_number, food_quality, service, ambiance, pricing, comments } = req.body;
    
    console.log('=== FEEDBACK SUBMISSION START ===');
    console.log('Received feedback data:', {
      restaurant_id,
      phone_number,
      phone_number_type: typeof phone_number,
      phone_number_length: phone_number?.length,
      food_quality,
      service,
      ambiance,
      pricing,
      comments
    });

    // Validate required fields
    if (!restaurant_id || !food_quality || !service || !ambiance || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'All rating fields are required'
      });
    }

    // Clean and validate phone number
    let finalPhoneNumber = null;
    
    if (phone_number) {
      const trimmedPhone = phone_number.trim();
      console.log('Phone number trimmed:', trimmedPhone);
      
      // Only validate if it's not just '+91' or empty
      if (trimmedPhone && trimmedPhone !== '+91') {
        const phoneRegex = /^\+91[6-9]\d{9}$/;
        if (!phoneRegex.test(trimmedPhone)) {
          console.log('Phone number validation FAILED:', {
            phone: trimmedPhone,
            regex_test: phoneRegex.test(trimmedPhone)
          });
          return res.status(400).json({
            success: false,
            message: 'Please enter a valid Indian mobile number (+91 followed by 10 digits starting with 6-9)'
          });
        }
        finalPhoneNumber = trimmedPhone;
        console.log('Phone number validated successfully:', finalPhoneNumber);
      } else {
        console.log('Phone number is empty or just +91, setting to null');
      }
    }
      
    console.log('Final phone number to insert:', finalPhoneNumber);

    // Validate rating values (1-5)
    const ratings = [food_quality, service, ambiance, pricing];
    if (ratings.some(r => r < 1 || r > 5)) {
      return res.status(400).json({
        success: false,
        message: 'All ratings must be between 1 and 5'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO feedback 
       (restaurant_id, phone_number, food_quality, service, ambiance, pricing, comments) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [restaurant_id, finalPhoneNumber, food_quality, service, ambiance, pricing, comments || null]
    );

    console.log('=== DATABASE INSERT SUCCESS ===');
    console.log('Feedback inserted successfully:', {
      insertId: result.insertId,
      phone_number_inserted: finalPhoneNumber,
      affectedRows: result.affectedRows
    });
    console.log('=== FEEDBACK SUBMISSION END ===');

    res.json({
      success: true,
      message: 'Thank you for your feedback!',
      feedback_id: result.insertId
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// Get all feedback for a restaurant (admin only)
router.get('/restaurant/:restaurant_id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { restaurant_id } = req.params;
    const { start_date, end_date, min_rating } = req.query;

    let query = 'SELECT * FROM feedback WHERE restaurant_id = ?';
    const params = [restaurant_id];

    // Add date filters if provided
    if (start_date) {
      query += ' AND created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }

    // Add minimum rating filter if provided
    if (min_rating) {
      query += ' AND ((food_quality + service + ambiance + pricing) / 4) >= ?';
      params.push(min_rating);
    }

    query += ' ORDER BY created_at DESC';

    const [feedback] = await pool.query(query, params);

    res.json({
      success: true,
      feedback,
      count: feedback.length
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

// Get feedback statistics for a restaurant (admin only)
router.get('/stats/:restaurant_id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { restaurant_id } = req.params;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(food_quality) as avg_food_quality,
        AVG(service) as avg_service,
        AVG(ambiance) as avg_ambiance,
        AVG(pricing) as avg_pricing,
        AVG((food_quality + service + ambiance + pricing) / 4) as overall_rating,
        MIN(created_at) as first_review,
        MAX(created_at) as latest_review
      FROM feedback 
      WHERE restaurant_id = ?
    `;
    const params = [restaurant_id];

    if (start_date) {
      query += ' AND created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }

    const [stats] = await pool.query(query, params);

    // Get rating distribution
    const [distribution] = await pool.query(
      `SELECT 
        SUM(CASE WHEN (food_quality + service + ambiance + pricing) / 4 >= 4.5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN (food_quality + service + ambiance + pricing) / 4 >= 3.5 AND (food_quality + service + ambiance + pricing) / 4 < 4.5 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN (food_quality + service + ambiance + pricing) / 4 >= 2.5 AND (food_quality + service + ambiance + pricing) / 4 < 3.5 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN (food_quality + service + ambiance + pricing) / 4 >= 1.5 AND (food_quality + service + ambiance + pricing) / 4 < 2.5 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN (food_quality + service + ambiance + pricing) / 4 < 1.5 THEN 1 ELSE 0 END) as one_star
      FROM feedback 
      WHERE restaurant_id = ?` + 
      (start_date ? ' AND created_at >= ?' : '') +
      (end_date ? ' AND created_at <= ?' : ''),
      params
    );

    res.json({
      success: true,
      stats: stats[0],
      distribution: distribution[0]
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics',
      error: error.message
    });
  }
});

// Delete feedback (admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM feedback WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message
    });
  }
});

// Delete all feedback for a restaurant (admin only)
router.delete('/restaurant/:restaurant_id/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { restaurant_id } = req.params;

    const [result] = await pool.query('DELETE FROM feedback WHERE restaurant_id = ?', [restaurant_id]);

    res.json({
      success: true,
      message: `Deleted ${result.affectedRows} feedback entries`,
      deleted_count: result.affectedRows
    });
  } catch (error) {
    console.error('Error deleting all feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all feedback',
      error: error.message
    });
  }
});

  // Export feedback to PDF
  router.get('/export-pdf/:restaurant_id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { restaurant_id } = req.params;
    const { startDate, endDate } = req.query;

    // Get restaurant info
    const [restaurant] = await pool.query('SELECT name FROM restaurants WHERE id = ?', [restaurant_id]);
    if (!restaurant.length) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Get feedback data
    let query = 'SELECT * FROM feedback WHERE restaurant_id = ?';
    const params = [restaurant_id];

    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }

    query += ' ORDER BY created_at DESC';

    const [feedback] = await pool.query(query, params);

    // Get statistics
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(food_quality) as avg_food_quality,
        AVG(service) as avg_service,
        AVG(ambiance) as avg_ambiance,
        AVG(pricing) as avg_pricing,
        AVG((food_quality + service + ambiance + pricing) / 4) as overall_rating
      FROM feedback 
      WHERE restaurant_id = ?` + 
      (startDate ? ' AND created_at >= ?' : '') +
      (endDate ? ' AND created_at <= ?' : ''),
      params
    );

    // Generate PDF using pdfkit (better Unicode support)
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Register Arial Unicode MS font
    doc.registerFont('Arial Unicode MS', './routes/arial-unicode-ms.ttf');
    
    // Helper function to add star images to PDF
    const addStars = (doc, x, y, rating) => {
      const spacing = 12; // Reduced spacing between stars
      
      for (let i = 0; i < 5; i++) {
        const starX = x + (i * spacing);
        if (i < rating) {
          // Filled star (★) - Unicode U+2605 with golden color
          doc.fillColor('#FFD700'); // Golden color
          doc.text('★', starX, y);
          doc.fillColor('#000000'); // Reset to black
        } else {
          // Empty star (☆) - Unicode U+2606 with gray color
          doc.fillColor('#CCCCCC'); // Light gray color
          doc.text('☆', starX, y);
          doc.fillColor('#000000'); // Reset to black
        }
      }
    };

    let yPos = 40;
    const pageHeight = 750;
    const margin = 40;

    // Set font to Arial Unicode MS for proper star support
    doc.font('Arial Unicode MS');

    // Helper function to check if we need a new page
    const needsNewPage = (requiredHeight) => {
        return yPos + requiredHeight > pageHeight - 50;
    };

    // Header
    doc.fontSize(16).font('Arial Unicode MS', 'bold');
    doc.text(`${restaurant[0].name} - Customer Reviews Report`, margin, yPos);
    yPos += 20;

    doc.fontSize(9).font('Arial Unicode MS', 'normal');
    if (startDate || endDate) {
      doc.text(`Date Range: ${startDate || 'All time'} to ${endDate || 'Present'}`, margin, yPos);
    } else {
      doc.text('Date Range: All time', margin, yPos);
    }
    yPos += 25;

    // Summary Statistics
    doc.fontSize(12).font('Arial Unicode MS', 'bold');
    doc.text('Summary Statistics', margin, yPos);
    yPos += 15;

    doc.fontSize(9).font('Arial Unicode MS', 'normal');
    doc.text(`Total Reviews: ${stats[0].total_reviews}`, margin + 10, yPos);
    yPos += 12;
    
    // Overall Rating with stars
    doc.text(`Overall Rating: ${stats[0].overall_rating ? parseFloat(stats[0].overall_rating).toFixed(2) : 'N/A'} / 5`, margin + 10, yPos);
    if (stats[0].overall_rating) {
        doc.fontSize(12).font('Arial Unicode MS', 'normal');
        addStars(doc, margin + 120, yPos, Math.round(parseFloat(stats[0].overall_rating)));
    }
    yPos += 15;
    
    // Food Quality with stars
    doc.fontSize(9).font('Arial Unicode MS', 'normal');
    doc.text(`Food Quality: ${stats[0].avg_food_quality ? parseFloat(stats[0].avg_food_quality).toFixed(2) : 'N/A'} / 5`, margin + 10, yPos);
    if (stats[0].avg_food_quality) {
        doc.fontSize(12).font('Arial Unicode MS', 'normal');
        addStars(doc, margin + 120, yPos, Math.round(parseFloat(stats[0].avg_food_quality)));
    }
    yPos += 15;
    
    // Service with stars
    doc.fontSize(9).font('Arial Unicode MS', 'normal');
    doc.text(`Service: ${stats[0].avg_service ? parseFloat(stats[0].avg_service).toFixed(2) : 'N/A'} / 5`, margin + 10, yPos);
    if (stats[0].avg_service) {
        doc.fontSize(12).font('Arial Unicode MS', 'normal');
        addStars(doc, margin + 120, yPos, Math.round(parseFloat(stats[0].avg_service)));
    }
    yPos += 15;
    
    // Ambiance with stars
    doc.fontSize(9).font('Arial Unicode MS', 'normal');
    doc.text(`Ambiance: ${stats[0].avg_ambiance ? parseFloat(stats[0].avg_ambiance).toFixed(2) : 'N/A'} / 5`, margin + 10, yPos);
    if (stats[0].avg_ambiance) {
        doc.fontSize(12).font('Arial Unicode MS', 'normal');
        addStars(doc, margin + 120, yPos, Math.round(parseFloat(stats[0].avg_ambiance)));
    }
    yPos += 15;
    
    // Pricing with stars
    doc.fontSize(9).font('Arial Unicode MS', 'normal');
    doc.text(`Pricing: ${stats[0].avg_pricing ? parseFloat(stats[0].avg_pricing).toFixed(2) : 'N/A'} / 5`, margin + 10, yPos);
    if (stats[0].avg_pricing) {
        doc.fontSize(12).font('Arial Unicode MS', 'normal');
        addStars(doc, margin + 120, yPos, Math.round(parseFloat(stats[0].avg_pricing)));
    }
    yPos += 20;

    // Individual Reviews
    doc.fontSize(12).font('Arial Unicode MS', 'bold');
    doc.text('Individual Reviews', margin, yPos);
    yPos += 15;

    // Define column layout
    const pageWidth = 550; // Total page width
    const columnWidth = (pageWidth - margin * 2 - 20) / 2; // Two columns with gap
    const leftColumnX = margin + 10;
    const rightColumnX = margin + columnWidth + 30;
    const columnGap = 20;

    // Helper function to get column position
    const getColumnX = (columnIndex) => {
        return columnIndex === 0 ? leftColumnX : rightColumnX;
    };

    // Helper function to get column width
    const getColumnWidth = () => columnWidth - 20;

    // Process reviews in pairs for two-column layout
    for (let i = 0; i < feedback.length; i += 2) {
        const leftReview = feedback[i];
        const rightReview = feedback[i + 1];
        
        // Check if we need a new page for this pair
        const pairHeight = 140; // Height needed for a pair of reviews
        if (needsNewPage(pairHeight)) {
            doc.addPage();
            yPos = 40;
        }

        // Process left column review
        if (leftReview) {
            const currentY = yPos;
            const reviewX = getColumnX(0);
            
            doc.fontSize(10).font('Arial Unicode MS', 'bold');
            doc.text(`Review ${i + 1}:`, reviewX, currentY);
            let currentYPos = currentY + 12;

            // Customer and Date Info
            doc.fontSize(8).font('Arial Unicode MS', 'normal');
            doc.text(`Phone: ${leftReview.phone_number || 'Not provided'}`, reviewX, currentYPos);
            currentYPos += 10;
            doc.text(`Date: ${new Date(leftReview.created_at).toLocaleDateString()}`, reviewX, currentYPos);
            currentYPos += 12;

            // Category Ratings
            const categoryHeight = 15;
            const starsX = reviewX + 50;
            const ratingValueX = reviewX + 130; // Increased spacing to prevent overlap

            // Food rating
            doc.fontSize(9).font('Arial Unicode MS', 'bold');
            doc.text(`Food:`, reviewX, currentYPos);
            doc.fontSize(12).font('Arial Unicode MS', 'normal');
            addStars(doc, starsX, currentYPos, leftReview.food_quality);
            doc.fontSize(8).font('Arial Unicode MS', 'normal');
            doc.text(`(${leftReview.food_quality}/5)`, ratingValueX, currentYPos);
            currentYPos += categoryHeight;

            // Service rating
            doc.fontSize(9).font('Arial Unicode MS', 'bold');
            doc.text(`Service:`, reviewX, currentYPos);
            doc.fontSize(12).font('Arial Unicode MS', 'normal');
            addStars(doc, starsX, currentYPos, leftReview.service);
            doc.fontSize(8).font('Arial Unicode MS', 'normal');
            doc.text(`(${leftReview.service}/5)`, ratingValueX, currentYPos);
            currentYPos += categoryHeight;

            // Ambiance rating
            doc.fontSize(9).font('Arial Unicode MS', 'bold');
            doc.text(`Ambiance:`, reviewX, currentYPos);
            doc.fontSize(12).font('Arial Unicode MS', 'normal');
            addStars(doc, starsX, currentYPos, leftReview.ambiance);
            doc.fontSize(8).font('Arial Unicode MS', 'normal');
            doc.text(`(${leftReview.ambiance}/5)`, ratingValueX, currentYPos);
            currentYPos += categoryHeight;

            // Pricing rating
            doc.fontSize(9).font('Arial Unicode MS', 'bold');
            doc.text(`Pricing:`, reviewX, currentYPos);
            doc.fontSize(12).font('Arial Unicode MS', 'normal');
            addStars(doc, starsX, currentYPos, leftReview.pricing);
            doc.fontSize(8).font('Arial Unicode MS', 'normal');
            doc.text(`(${leftReview.pricing}/5)`, ratingValueX, currentYPos);
            currentYPos += categoryHeight + 3;

            // Average rating
            doc.fontSize(9).font('Arial Unicode MS', 'bold');
            const average = ((leftReview.food_quality + leftReview.service + leftReview.ambiance + leftReview.pricing) / 4).toFixed(1);
            doc.text(`Average: ${average} / 5`, reviewX, currentYPos);
            currentYPos += 12;

            // Comments section
            if (leftReview.comments) {
                doc.fontSize(8).font('Arial Unicode MS', 'bold');
                doc.text('Comments:', reviewX, currentYPos);
                currentYPos += 8;
                doc.fontSize(8).font('Arial Unicode MS', 'normal');
                doc.text(leftReview.comments, reviewX, currentYPos, { width: getColumnWidth() });
                currentYPos += 15;
            }

            // Separator line for left column
            doc.strokeColor('#cccccc');
            doc.moveTo(reviewX, currentYPos + 3).lineTo(reviewX + getColumnWidth(), currentYPos + 3).stroke();
            currentYPos += 8;
        }

        // Process right column review
        if (rightReview) {
            const currentY = yPos;
            const reviewX = getColumnX(1);
            
            doc.fontSize(10).font('Arial Unicode MS', 'bold');
            doc.text(`Review ${i + 2}:`, reviewX, currentY);
            let currentYPos = currentY + 12;

            // Customer and Date Info
            doc.fontSize(8).font('Arial Unicode MS', 'normal');
            doc.text(`Phone: ${rightReview.phone_number || 'Not provided'}`, reviewX, currentYPos);
            currentYPos += 10;
            doc.text(`Date: ${new Date(rightReview.created_at).toLocaleDateString()}`, reviewX, currentYPos);
            currentYPos += 12;

            // Category Ratings
            const categoryHeight = 15;
            const starsX = reviewX + 50;
            const ratingValueX = reviewX + 130; // Increased spacing to prevent overlap

            // Food rating
            doc.fontSize(9).font('Arial Unicode MS', 'bold');
            doc.text(`Food:`, reviewX, currentYPos);
            doc.fontSize(12).font('Arial Unicode MS', 'normal');
            addStars(doc, starsX, currentYPos, rightReview.food_quality);
            doc.fontSize(8).font('Arial Unicode MS', 'normal');
            doc.text(`(${rightReview.food_quality}/5)`, ratingValueX, currentYPos);
            currentYPos += categoryHeight;

            // Service rating
            doc.fontSize(9).font('Arial Unicode MS', 'bold');
            doc.text(`Service:`, reviewX, currentYPos);
            doc.fontSize(12).font('Arial Unicode MS', 'normal');
            addStars(doc, starsX, currentYPos, rightReview.service);
            doc.fontSize(8).font('Arial Unicode MS', 'normal');
            doc.text(`(${rightReview.service}/5)`, ratingValueX, currentYPos);
            currentYPos += categoryHeight;

            // Ambiance rating
            doc.fontSize(9).font('Arial Unicode MS', 'bold');
            doc.text(`Ambiance:`, reviewX, currentYPos);
            doc.fontSize(12).font('Arial Unicode MS', 'normal');
            addStars(doc, starsX, currentYPos, rightReview.ambiance);
            doc.fontSize(8).font('Arial Unicode MS', 'normal');
            doc.text(`(${rightReview.ambiance}/5)`, ratingValueX, currentYPos);
            currentYPos += categoryHeight;

            // Pricing rating
            doc.fontSize(9).font('Arial Unicode MS', 'bold');
            doc.text(`Pricing:`, reviewX, currentYPos);
            doc.fontSize(12).font('Arial Unicode MS', 'normal');
            addStars(doc, starsX, currentYPos, rightReview.pricing);
            doc.fontSize(8).font('Arial Unicode MS', 'normal');
            doc.text(`(${rightReview.pricing}/5)`, ratingValueX, currentYPos);
            currentYPos += categoryHeight + 3;

            // Average rating
            doc.fontSize(9).font('Arial Unicode MS', 'bold');
            const average = ((rightReview.food_quality + rightReview.service + rightReview.ambiance + rightReview.pricing) / 4).toFixed(1);
            doc.text(`Average: ${average} / 5`, reviewX, currentYPos);
            currentYPos += 12;

            // Comments section
            if (rightReview.comments) {
                doc.fontSize(8).font('Arial Unicode MS', 'bold');
                doc.text('Comments:', reviewX, currentYPos);
                currentYPos += 8;
                doc.fontSize(8).font('Arial Unicode MS', 'normal');
                doc.text(rightReview.comments, reviewX, currentYPos, { width: getColumnWidth() });
                currentYPos += 15;
            }

            // Separator line for right column
            doc.strokeColor('#cccccc');
            doc.moveTo(reviewX, currentYPos + 3).lineTo(reviewX + getColumnWidth(), currentYPos + 3).stroke();
            currentYPos += 8;
        }

        // Move to next row
        yPos += 140; // Height for a pair of reviews
    }
    
    // Finalize PDF and send response
    doc.end();
    
    // Set up response headers
    const safeName = String(restaurant[0].name || 'restaurant').replace(/[^a-z0-9\-\s_]/gi, '').trim().replace(/\s+/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reviews-${safeName}-${new Date().toISOString().split('T')[0]}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export PDF',
      error: error.message
    });
  }
});

module.exports = router;
