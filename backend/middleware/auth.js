const jwt = require('jsonwebtoken');

// Simple in-memory user storage (in production, use a database)
const users = [
    {
        id: 1,
        username: 'admin',
        password: 'admin123', // In production, hash this password
        role: 'admin'
    },
    {
        id: 2,
        username: 'manager',
        password: 'manager123',
        role: 'admin'
    },
    {
        id: 3,
        username: 'supervisor',
        password: 'supervisor123',
        role: 'admin'
    }
];

// JWT Secret (in production, use environment variable)
const JWT_SECRET = 'your-secret-key-change-in-production';

// Login function
const login = async (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        throw new Error('Invalid credentials');
    }
    
    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
    
    return { token, user: { id: user.id, username: user.username, role: user.role } };
};

// Verify token middleware
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    next();
};

module.exports = {
    login,
    verifyToken,
    requireAdmin,
    users
};
