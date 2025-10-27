const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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
    // Allow requests with no origin (like mobile apps, curl, server-to-server, health checks)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin header');
      return callback(null, true);
    }
    
    // Log the origin for debugging
    console.log(`🔍 CORS: Request from origin: ${origin}`);
    
    // Allow localhost and network IPs
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'https://menu-card-2hha.vercel.app',  // Production frontend
      'https://menu-card-2hha-omwxl50sb-aryan-shettys-projects-d3a649f4.vercel.app'  // Preview deployment
    ];
    
    // Allow any 192.168.x.x network IP
    if (origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/)) {
      console.log('✅ CORS: Allowing local network IP');
      return callback(null, true);
    }
    
    // Allow all Vercel preview deployments
    if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
      console.log('✅ CORS: Allowing Vercel deployment');
      return callback(null, true);
    }
    
    // Allow Render.com domains (for health checks and internal requests)
    if (origin.match(/^https:\/\/.*\.onrender\.com$/)) {
      console.log('✅ CORS: Allowing Render domain');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Allowing whitelisted origin');
      return callback(null, true);
    }
    
    // In production, be more permissive to avoid deployment issues
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ CORS: Allowing unrecognized origin in production mode');
      return callback(null, true);
    }
    
    console.error(`❌ CORS: Blocking origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from frontend build (only if it exists)
const frontendBuildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
}
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
const serveHtmlFile = (filename) => {
  return (req, res) => {
    // Try multiple possible locations - check current directory first for Railway
    const possiblePaths = [
      path.join(__dirname, filename),  // First try same directory (backend/) - for Railway
      path.join(__dirname, '../' + filename),  // Then parent directory - for local dev
      path.join(__dirname, '../../' + filename),  // Two levels up
      path.join(process.cwd(), filename),  // Root directory
      path.join(process.cwd(), '..', filename),  // One level up from root
    ];
    
    let filePath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath;
        console.log(`✅ Serving ${filename} from: ${filePath}`);
        break;
      }
    }
    
    if (filePath) {
      res.sendFile(filePath);
    } else {
      console.error(`❌ File not found: ${filename}. Checked paths: ${possiblePaths.join(', ')}`);
      res.status(404).json({ 
        success: false, 
        message: 'File not found',
        filename: filename
      });
    }
  };
};

app.get('/login.html', serveHtmlFile('login.html'));

// Serve admin pages
app.get('/admin.html', serveHtmlFile('admin.html'));
app.get('/admin-menu-manager.html', serveHtmlFile('admin-menu-manager.html'));
app.get('/admin-reviews.html', serveHtmlFile('admin-reviews.html'));
app.get('/admin-users.html', serveHtmlFile('admin-users.html'));

// Serve main pages (only if frontend build exists)
if (fs.existsSync(frontendBuildPath)) {
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
}

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
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
      console.log(`📊 Health Check: /api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();