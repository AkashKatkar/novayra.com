const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Place new order
router.post('/place', authenticateToken, [
    body('shipping_address').trim().isLength({ min: 10 }),
    body('shipping_city').trim().isLength({ min: 2 }),
    body('shipping_state').trim().isLength({ min: 2 }),
    body('shipping_postal_code').trim().isLength({ min: 5 }),
    body('shipping_country').optional().trim(),
    body('payment_method').isIn(['cod', 'online', 'card']),
    body('notes').optional().trim()
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const userId = req.user.id;
        const { shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, payment_method, notes } = req.body;

        // Get user's cart items
        const [cartItems] = await pool.execute(
            `SELECT ci.quantity, p.id as product_id, p.name, p.price, p.stock_quantity
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.user_id = ? AND p.is_active = TRUE`,
            [userId]
        );

        if (cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Validate stock availability and calculate total
        let totalAmount = 0;
        const orderItems = [];

        for (const item of cartItems) {
            if (item.quantity > item.stock_quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${item.name}. Only ${item.stock_quantity} available.`
                });
            }
            totalAmount += item.price * item.quantity;
            orderItems.push(item);
        }

        // Generate unique order number
        const orderNumber = `NOV-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Create order
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (user_id, order_number, total_amount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, payment_method, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, orderNumber, totalAmount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country || 'India', payment_method, notes]
            );

            const orderId = orderResult.insertId;

            // Create order items and update stock
            for (const item of orderItems) {
                await connection.execute(
                    `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [orderId, item.product_id, item.name, item.price, item.quantity, item.price * item.quantity]
                );

                // Update product stock
                await connection.execute(
                    'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }

            // Clear user's cart
            await connection.execute(
                'DELETE FROM cart_items WHERE user_id = ?',
                [userId]
            );

            await connection.commit();

            // Get the created order with items
            const [orders] = await pool.execute(
                `SELECT o.*, oi.* 
                 FROM orders o
                 JOIN order_items oi ON o.id = oi.order_id
                 WHERE o.id = ?`,
                [orderId]
            );

            res.status(201).json({
                success: true,
                message: 'Order placed successfully',
                data: {
                    order: {
                        id: orderId,
                        order_number: orderNumber,
                        total_amount: totalAmount,
                        status: 'pending',
                        items: orderItems
                    }
                }
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Place order error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user's orders
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [orders] = await pool.execute(
            `SELECT o.id, o.order_number, o.total_amount, o.status, o.payment_status, o.created_at,
                    o.shipping_address, o.shipping_city, o.shipping_state, o.shipping_postal_code
             FROM orders o
             WHERE o.user_id = ?
             ORDER BY o.created_at DESC`,
            [userId]
        );

        // Get order items for each order
        for (let order of orders) {
            const [orderItems] = await pool.execute(
                `SELECT oi.product_name, oi.product_price, oi.quantity, oi.subtotal
                 FROM order_items oi
                 WHERE oi.order_id = ?`,
                [order.id]
            );
            order.items = orderItems;
        }

        res.json({
            success: true,
            data: { orders }
        });

    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get single order by ID
router.get('/:orderId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.orderId;

        // Get order details
        const [orders] = await pool.execute(
            `SELECT o.*, u.first_name, u.last_name, u.email
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.id = ? AND (o.user_id = ? OR ? = TRUE)`,
            [orderId, userId, req.user.is_admin]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = orders[0];

        // Get order items
        const [orderItems] = await pool.execute(
            `SELECT oi.*, p.image_url, p.fragrance_notes, p.bottle_size
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        order.items = orderItems;

        res.json({
            success: true,
            data: { order }
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update order status (admin only)
router.put('/:orderId/status', authenticateToken, requireAdmin, [
    body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
    body('payment_status').optional().isIn(['pending', 'paid', 'failed', 'refunded'])
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const orderId = req.params.orderId;
        const { status, payment_status } = req.body;

        // Check if order exists
        const [orders] = await pool.execute(
            'SELECT id, status FROM orders WHERE id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Build update query
        const updateFields = [];
        const updateValues = [];

        if (status) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (payment_status) {
            updateFields.push('payment_status = ?');
            updateValues.push(payment_status);
        }

        updateValues.push(orderId);

        await pool.execute(
            `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        res.json({
            success: true,
            message: 'Order status updated successfully'
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get all orders (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT o.id, o.order_number, o.total_amount, o.status, o.payment_status, o.created_at,
                   u.first_name, u.last_name, u.email
            FROM orders o
            JOIN users u ON o.user_id = u.id
        `;
        const queryParams = [];

        if (status) {
            query += ' WHERE o.status = ?';
            queryParams.push(status);
        }

        query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), offset);

        const [orders] = await pool.execute(query, queryParams);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM orders o JOIN users u ON o.user_id = u.id';
        const countParams = [];

        if (status) {
            countQuery += ' WHERE o.status = ?';
            countParams.push(status);
        }

        const [countResult] = await pool.execute(countQuery, countParams);
        const totalOrders = countResult[0].total;

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalOrders,
                    pages: Math.ceil(totalOrders / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router; 