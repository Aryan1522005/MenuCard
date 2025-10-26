const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Import routes
const menuRoutes = require('./routes/menu');
const qrRoutes = require('./routes/qr');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');
const feedbackRoutes = require('./routes/feedback');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and network IPs
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ];
    
    // Allow any 192.168.x.x network IP
    if (origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/)) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve login page
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../login.html'));
});

// Serve admin pages
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin.html'));
});

app.get('/admin-menu-manager.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-menu-manager.html'));
});

app.get('/admin-reviews.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-reviews.html'));
});

app.get('/admin-users.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-users.html'));
});

// Serve main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Catch-all handler for React routing
app.get('*', (req, res, next) => {
  // If it's an API request, let it fall through to 404 handler
  if (req.path.startsWith('/api/')) {
    return next();
  }
  // Serve React app for all other routes
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

// Start server function
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.log('⚠️ Database connection failed, but continuing with server startup...');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://192.168.1.106:3000'}`);
      console.log(`🔗 API Base URL: http://192.168.1.106:${PORT}`);
      console.log(`📊 Health Check: http://192.168.1.106:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();