const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { 
    verifyToken, 
    createUser, 
    getAllUsers, 
    updateUser, 
    deleteUser, 
    changePassword 
} = require('../middleware/auth-database');
const { requireManager } = require('../middleware/permissions');

// Apply authentication middleware to all user routes
router.use(verifyToken);
router.use(requireManager);

// GET /api/users - Get all users
router.get('/', async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json({
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
    try {
        const { username, password, role, full_name, email } = req.body;
        
        // Validate required fields
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }
        
        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        
        const user = await createUser({
            username,
            password,
            role: role || 'admin',
            full_name,
            email
        });
        
        res.json({
            success: true,
            message: 'User created successfully',
            user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if manager is trying to edit admin user
        if (req.user.role === 'manager') {
            const [users] = await pool.execute('SELECT role FROM users WHERE id = ?', [id]);
            if (users.length > 0 && users[0].role === 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Managers cannot edit admin users.'
                });
            }
        }
        const { username, role, full_name, email, is_active } = req.body;
        
        await updateUser(id, {
            username,
            role,
            full_name,
            email,
            is_active
        });
        
        res.json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if manager is trying to delete admin user
        if (req.user.role === 'manager') {
            const [users] = await pool.execute('SELECT role FROM users WHERE id = ?', [id]);
            if (users.length > 0 && users[0].role === 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Managers cannot delete admin users.'
                });
            }
        }
        
        // Prevent deleting the current user
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }
        
        await deleteUser(id);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// POST /api/users/:id/change-password - Change user password
router.post('/:id/change-password', async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;
        
        console.log('Change password request:', { id, new_password, length: new_password?.length });
        
        // Check if manager is trying to change admin password
        if (req.user.role === 'manager') {
            const [users] = await pool.execute('SELECT role FROM users WHERE id = ?', [id]);
            if (users.length > 0 && users[0].role === 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Managers cannot change admin passwords.'
                });
            }
        }
        
        if (!new_password || new_password.length < 6) {
            console.log('Password validation failed:', { 
                hasPassword: !!new_password, 
                length: new_password?.length 
            });
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }
        
        await changePassword(id, new_password);
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
