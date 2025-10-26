const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Login function using database
const login = async (username, password) => {
    try {
        // Get user from database
        const [users] = await pool.execute(
            'SELECT id, username, password, role, full_name, email, is_active FROM users WHERE username = ? AND is_active = TRUE',
            [username]
        );
        
        if (users.length === 0) {
            throw new Error('Invalid credentials');
        }
        
        const user = users[0];
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        return { 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                full_name: user.full_name,
                email: user.email
            } 
        };
    } catch (error) {
        throw new Error('Authentication failed: ' + error.message);
    }
};

// Verify token middleware
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    next();
};

// Create new user
const createUser = async (userData) => {
    try {
        const { username, password, role = 'admin', full_name, email } = userData;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user into database
        const [result] = await pool.execute(
            'INSERT INTO users (username, password, role, full_name, email) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, role, full_name, email]
        );
        
        return {
            id: result.insertId,
            username,
            role,
            full_name,
            email
        };
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('Username already exists');
        }
        throw new Error('Failed to create user: ' + error.message);
    }
};

// Get all users
const getAllUsers = async () => {
    try {
        const [users] = await pool.execute(
            'SELECT id, username, role, full_name, email, is_active, created_at FROM users ORDER BY created_at DESC'
        );
        return users;
    } catch (error) {
        throw new Error('Failed to fetch users: ' + error.message);
    }
};

// Update user
const updateUser = async (userId, userData) => {
    try {
        const { username, role, full_name, email, is_active } = userData;
        
        await pool.execute(
            'UPDATE users SET username = ?, role = ?, full_name = ?, email = ?, is_active = ? WHERE id = ?',
            [username, role, full_name, email, is_active, userId]
        );
        
        return { success: true };
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('Username already exists');
        }
        throw new Error('Failed to update user: ' + error.message);
    }
};

// Delete user
const deleteUser = async (userId) => {
    try {
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        return { success: true };
    } catch (error) {
        throw new Error('Failed to delete user: ' + error.message);
    }
};

// Change password
const changePassword = async (userId, newPassword) => {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );
        return { success: true };
    } catch (error) {
        throw new Error('Failed to change password: ' + error.message);
    }
};

module.exports = {
    login,
    verifyToken,
    requireAdmin,
    createUser,
    getAllUsers,
    updateUser,
    deleteUser,
    changePassword
};
