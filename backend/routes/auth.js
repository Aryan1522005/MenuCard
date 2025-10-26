const express = require('express');
const router = express.Router();
const { login, verifyToken } = require('../middleware/auth-database');

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        const result = await login(username, password);
        res.json(result);
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
});

// Verify token endpoint
router.get('/verify', verifyToken, (req, res) => {
    res.json({ 
        valid: true, 
        user: { 
            id: req.user.id, 
            username: req.user.username, 
            role: req.user.role 
        } 
    });
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
