const express = require('express');
const router = express.Router();
const { adminAuth, logAdminActivity } = require('../middleware/adminAuth');
const { pool } = require('../config/database');

// Get all orders with pagination and filters
router.get('/', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const search = req.query.search || '';
        const status = req.query.status || '';
        const paymentStatus = req.query.paymentStatus || '';
        const dateFrom = req.query.dateFrom || '';
        const dateTo = req.query.dateTo || '';

        // Build WHERE clause
        let whereConditions = [];
        let params = [];

        if (search) {
            whereConditions.push(`(o.order_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`);
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        if (status) {
            whereConditions.push('o.status = ?');
            params.push(status);
        }

        if (paymentStatus) {
            whereConditions.push('o.payment_status = ?');
            params.push(paymentStatus);
        }

        if (dateFrom) {
            whereConditions.push('DATE(o.created_at) >= ?');
            params.push(dateFrom);
        }

        if (dateTo) {
            whereConditions.push('DATE(o.created_at) <= ?');
            params.push(dateTo);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Get total count
        const [countResult] = await pool.execute(`
            SELECT COUNT(*) as total
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.deleted_at IS NULL ${whereClause ? 'AND ' + whereClause.substring(6) : ''}
        `, params);

        const totalOrders = countResult[0].total;

        // Get orders
        const [orders] = await pool.execute(`
            SELECT 
                o.id,
                o.order_number,
                o.total_amount,
                o.status,
                o.payment_status,
                o.shipping_address,
                o.shipping_city,
                o.shipping_state,
                o.shipping_postal_code,
                o.payment_method,
                o.notes,
                o.admin_notes,
                o.tracking_number,
                o.created_at,
                o.updated_at,
                u.id as user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.deleted_at IS NULL ${whereClause ? 'AND ' + whereClause.substring(6) : ''}
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Get order items for each order
        for (let order of orders) {
            const [items] = await pool.execute(`
                SELECT 
                    oi.id,
                    oi.product_id,
                    oi.product_name,
                    oi.product_price,
                    oi.quantity,
                    oi.subtotal,
                    p.image_url
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ? AND oi.deleted_at IS NULL
            `, [order.id]);
            
            order.items = items;
        }

        res.json({
            success: true,
            orders,
            pagination: {
                page,
                limit,
                total: totalOrders,
                pages: Math.ceil(totalOrders / limit)
            }
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get orders'
        });
    }
});

// Get single order by ID
router.get('/:id', adminAuth, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);

        const [orders] = await pool.execute(`
            SELECT 
                o.*,
                u.first_name,
                u.last_name,
                u.email,
                u.phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ? AND o.deleted_at IS NULL
        `, [orderId]);

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = orders[0];

        // Get order items
        const [items] = await pool.execute(`
            SELECT 
                oi.*,
                p.image_url,
                p.category
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ? AND oi.deleted_at IS NULL
        `, [orderId]);

        order.items = items;

        res.json({
            success: true,
            order
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order'
        });
    }
});

// Update order status
router.patch('/:id/status', adminAuth, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status, adminNotes, trackingNumber } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Update order
        await pool.execute(`
            UPDATE orders 
            SET status = ?, admin_notes = ?, tracking_number = ?, updated_at = NOW()
            WHERE id = ?
        `, [status, adminNotes || null, trackingNumber || null, orderId]);

        // Log activity
        await logAdminActivity(
            req.admin.id,
            'UPDATE_ORDER_STATUS',
            'orders',
            orderId,
            { status, adminNotes, trackingNumber },
            req
        );

        res.json({
            success: true,
            message: 'Order status updated successfully'
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status'
        });
    }
});

// Update payment status
router.patch('/:id/payment', adminAuth, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { paymentStatus } = req.body;

        if (!paymentStatus) {
            return res.status(400).json({
                success: false,
                message: 'Payment status is required'
            });
        }

        const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        if (!validPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status'
            });
        }

        // Update order
        await pool.execute(`
            UPDATE orders 
            SET payment_status = ?, updated_at = NOW()
            WHERE id = ?
        `, [paymentStatus, orderId]);

        // Log activity
        await logAdminActivity(
            req.admin.id,
            'UPDATE_PAYMENT_STATUS',
            'orders',
            orderId,
            { paymentStatus },
            req
        );

        res.json({
            success: true,
            message: 'Payment status updated successfully'
        });

    } catch (error) {
        console.error('Update payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update payment status'
        });
    }
});

// Add admin notes to order
router.patch('/:id/notes', adminAuth, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { adminNotes } = req.body;

        if (!adminNotes) {
            return res.status(400).json({
                success: false,
                message: 'Admin notes are required'
            });
        }

        // Update order
        await pool.execute(`
            UPDATE orders 
            SET admin_notes = ?, updated_at = NOW()
            WHERE id = ?
        `, [adminNotes, orderId]);

        // Log activity
        await logAdminActivity(
            req.admin.id,
            'UPDATE_ADMIN_NOTES',
            'orders',
            orderId,
            { adminNotes },
            req
        );

        res.json({
            success: true,
            message: 'Admin notes updated successfully'
        });

    } catch (error) {
        console.error('Update admin notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update admin notes'
        });
    }
});

// Get order statistics
router.get('/stats/summary', adminAuth, async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
                COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
                COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
                COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
                COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_payments
            FROM orders
        `);

        // Get monthly revenue for the last 6 months
        const [monthlyRevenue] = await pool.execute(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                SUM(total_amount) as revenue,
                COUNT(*) as orders
            FROM orders
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month DESC
        `);

        res.json({
            success: true,
            stats: stats[0],
            monthlyRevenue
        });

    } catch (error) {
        console.error('Order stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order statistics'
        });
    }
});

module.exports = router; 