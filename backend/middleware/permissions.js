const { verifyToken } = require('./auth-database');

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Admin role required.' 
        });
    }
    next();
};

// Middleware to check if user has manager role or higher
const requireManager = (req, res, next) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Manager role or higher required.' 
        });
    }
    next();
};

// Middleware to check if user has viewer role or higher (all authenticated users)
const requireViewer = (req, res, next) => {
    if (!['admin', 'manager', 'viewer'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Valid user role required.' 
        });
    }
    next();
};

// Middleware to check if user can delete restaurants (admin or manager)
const canDeleteRestaurant = (req, res, next) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Manager role or higher required to delete restaurants.' 
        });
    }
    next();
};

// Middleware to check if user can manage menu items (all roles)
const canManageMenu = (req, res, next) => {
    if (!['admin', 'manager', 'viewer'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Valid user role required to manage menu items.' 
        });
    }
    next();
};

// Middleware to check if user can add restaurants (manager and admin only)
const canAddRestaurant = (req, res, next) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Manager role or higher required to add restaurants.' 
        });
    }
    next();
};

module.exports = {
    requireAdmin,
    requireManager,
    requireViewer,
    canDeleteRestaurant,
    canManageMenu,
    canAddRestaurant
};
