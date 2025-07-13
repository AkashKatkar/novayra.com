const express = require('express');
const router = express.Router();
const { adminAuth, adminLogin, adminLogout, logAdminActivity } = require('../middleware/adminAuth');
const { pool } = require('../config/database');

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const result = await adminLogin(email, password);

        if (!result.success) {
            return res.status(401).json(result);
        }

        // Set cookie for web interface
        res.cookie('adminToken', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json(result);

    } catch (error) {
        console.error('Admin login route error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// Admin logout
router.post('/logout', adminAuth, async (req, res) => {
    try {
        await adminLogout(req.sessionToken);
        
        res.clearCookie('adminToken');
        res.json({ success: true, message: 'Logged out successfully' });

    } catch (error) {
        console.error('Admin logout route error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

// Get admin profile
router.get('/profile', adminAuth, async (req, res) => {
    try {
        res.json({
            success: true,
            admin: req.admin
        });
    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
});

// Get dashboard statistics
router.get('/dashboard/stats', adminAuth, async (req, res) => {
    try {
        // Get cached stats or calculate fresh ones
        const [cachedStats] = await pool.execute(
            'SELECT stat_name, stat_value FROM dashboard_stats'
        );

        let stats = {};
        cachedStats.forEach(row => {
            stats[row.stat_name] = JSON.parse(row.stat_value);
        });

        // Calculate fresh stats if needed
        const [orderStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders
            FROM orders
        `);

        const [productStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN stock_quantity <= 10 THEN 1 END) as low_stock_products
            FROM products
        `);

        const [contactStats] = await pool.execute(`
            SELECT COUNT(CASE WHEN status = 'new' THEN 1 END) as new_contacts
            FROM contact_messages
        `);

        const [sampleStats] = await pool.execute(`
            SELECT COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_samples
            FROM sample_requests
        `);

        const freshStats = {
            total_orders: { value: orderStats[0].total_orders || 0, period: 'all_time' },
            total_revenue: { value: parseFloat(orderStats[0].total_revenue) || 0, period: 'all_time' },
            total_products: { value: productStats[0].total_products || 0, period: 'all_time' },
            pending_orders: { value: orderStats[0].pending_orders || 0, period: 'current' },
            processing_orders: { value: orderStats[0].processing_orders || 0, period: 'current' },
            low_stock_products: { value: productStats[0].low_stock_products || 0, period: 'current' },
            new_contacts: { value: contactStats[0].new_contacts || 0, period: 'current' },
            pending_samples: { value: sampleStats[0].pending_samples || 0, period: 'current' }
        };

        // Update cached stats
        for (const [statName, statValue] of Object.entries(freshStats)) {
            await pool.execute(
                'INSERT INTO dashboard_stats (stat_name, stat_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE stat_value = VALUES(stat_value)',
                [statName, JSON.stringify(statValue)]
            );
        }

        res.json({
            success: true,
            stats: freshStats
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard statistics'
        });
    }
});

// Get recent activity
router.get('/dashboard/activity', adminAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const [activities] = await pool.execute(`
            SELECT 
                al.action,
                al.table_name,
                al.record_id,
                al.details,
                al.created_at,
                u.first_name,
                u.last_name
            FROM admin_activity_log al
            JOIN users u ON al.admin_id = u.id
            ORDER BY al.created_at DESC
            LIMIT ?
        `, [limit]);

        res.json({
            success: true,
            activities: activities.map(activity => ({
                ...activity,
                details: activity.details ? JSON.parse(activity.details) : null
            }))
        });

    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recent activity'
        });
    }
});

// Get recent orders for dashboard
router.get('/dashboard/recent-orders', adminAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        
        const [orders] = await pool.execute(`
            SELECT 
                o.id,
                o.order_number,
                o.total_amount,
                o.status,
                o.payment_status,
                o.created_at,
                u.first_name,
                u.last_name,
                u.email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT ?
        `, [limit]);

        res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error('Recent orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recent orders'
        });
    }
});

// Get low stock products
router.get('/dashboard/low-stock', adminAuth, async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 10;
        
        const [products] = await pool.execute(`
            SELECT 
                id,
                name,
                stock_quantity,
                price,
                category
            FROM products
            WHERE stock_quantity <= ?
            ORDER BY stock_quantity ASC
        `, [threshold]);

        res.json({
            success: true,
            products
        });

    } catch (error) {
        console.error('Low stock products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get low stock products'
        });
    }
});

// Verify admin session (for frontend)
router.get('/verify', adminAuth, async (req, res) => {
    try {
        res.json({
            success: true,
            admin: req.admin,
            message: 'Session is valid'
        });
    } catch (error) {
        console.error('Session verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid session'
        });
    }
});

module.exports = router; 