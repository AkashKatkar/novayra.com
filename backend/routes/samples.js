const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Submit sample request
router.post('/request', optionalAuth, [
    body('product_id').isInt({ min: 1 }),
    body('customer_name').trim().isLength({ min: 2 }),
    body('customer_email').isEmail().normalizeEmail(),
    body('customer_phone').optional().isMobilePhone(),
    body('sample_size').isIn(['2ml', '5ml', '10ml']),
    body('shipping_address').trim().isLength({ min: 10 }),
    body('shipping_city').trim().isLength({ min: 2 }),
    body('shipping_state').trim().isLength({ min: 2 }),
    body('shipping_postal_code').trim().isLength({ min: 5 })
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

        const { product_id, customer_name, customer_email, customer_phone, sample_size, shipping_address, shipping_city, shipping_state, shipping_postal_code } = req.body;
        const userId = req.user ? req.user.id : null;

        // Check if product exists and is active
        const [products] = await pool.execute(
            'SELECT id, name FROM products WHERE id = ? AND is_active = TRUE',
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or unavailable'
            });
        }

        // Check if user has already requested this product sample (if logged in)
        if (userId) {
            const [existingRequests] = await pool.execute(
                'SELECT id FROM sample_requests WHERE user_id = ? AND product_id = ? AND status IN ("pending", "approved")',
                [userId, product_id]
            );

            if (existingRequests.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already requested a sample for this product'
                });
            }
        }

        // Create sample request
        const [result] = await pool.execute(
            `INSERT INTO sample_requests (user_id, product_id, customer_name, customer_email, customer_phone, sample_size, shipping_address, shipping_city, shipping_state, shipping_postal_code) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, product_id, customer_name, customer_email, customer_phone, sample_size, shipping_address, shipping_city, shipping_state, shipping_postal_code]
        );

        res.status(201).json({
            success: true,
            message: 'Sample request submitted successfully',
            data: {
                request_id: result.insertId,
                product_name: products[0].name
            }
        });

    } catch (error) {
        console.error('Submit sample request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user's sample requests
router.get('/my-requests', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [requests] = await pool.execute(
            `SELECT sr.id, sr.sample_size, sr.status, sr.created_at, sr.admin_notes,
                    p.name as product_name, p.image_url, p.fragrance_notes
             FROM sample_requests sr
             JOIN products p ON sr.product_id = p.id
             WHERE sr.user_id = ?
             ORDER BY sr.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: { requests }
        });

    } catch (error) {
        console.error('Get user sample requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get all sample requests (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT sr.id, sr.customer_name, sr.customer_email, sr.sample_size, sr.status, sr.created_at,
                   p.name as product_name, p.image_url
            FROM sample_requests sr
            JOIN products p ON sr.product_id = p.id
        `;
        const queryParams = [];

        if (status) {
            query += ' WHERE sr.status = ?';
            queryParams.push(status);
        }

        query += ' ORDER BY sr.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), offset);

        const [requests] = await pool.execute(query, queryParams);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM sample_requests sr JOIN products p ON sr.product_id = p.id';
        const countParams = [];

        if (status) {
            countQuery += ' WHERE sr.status = ?';
            countParams.push(status);
        }

        const [countResult] = await pool.execute(countQuery, countParams);
        const totalRequests = countResult[0].total;

        res.json({
            success: true,
            data: {
                requests,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalRequests,
                    pages: Math.ceil(totalRequests / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get all sample requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get single sample request (admin only)
router.get('/:requestId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const requestId = req.params.requestId;

        const [requests] = await pool.execute(
            `SELECT sr.*, p.name as product_name, p.image_url, p.fragrance_notes, p.bottle_size
             FROM sample_requests sr
             JOIN products p ON sr.product_id = p.id
             WHERE sr.id = ?`,
            [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sample request not found'
            });
        }

        res.json({
            success: true,
            data: { request: requests[0] }
        });

    } catch (error) {
        console.error('Get sample request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update sample request status (admin only)
router.put('/:requestId/status', authenticateToken, requireAdmin, [
    body('status').isIn(['pending', 'approved', 'shipped', 'delivered', 'rejected']),
    body('admin_notes').optional().trim()
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

        const requestId = req.params.requestId;
        const { status, admin_notes } = req.body;

        // Check if request exists
        const [requests] = await pool.execute(
            'SELECT id, status FROM sample_requests WHERE id = ?',
            [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sample request not found'
            });
        }

        // Build update query
        const updateFields = ['status = ?'];
        const updateValues = [status];

        if (admin_notes) {
            updateFields.push('admin_notes = ?');
            updateValues.push(admin_notes);
        }

        updateValues.push(requestId);

        await pool.execute(
            `UPDATE sample_requests SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        res.json({
            success: true,
            message: 'Sample request status updated successfully'
        });

    } catch (error) {
        console.error('Update sample request status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get sample request statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get total requests by status
        const [statusStats] = await pool.execute(
            `SELECT status, COUNT(*) as count 
             FROM sample_requests 
             GROUP BY status`
        );

        // Get recent requests (last 7 days)
        const [recentRequests] = await pool.execute(
            `SELECT COUNT(*) as count 
             FROM sample_requests 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        // Get most requested products
        const [popularProducts] = await pool.execute(
            `SELECT p.name, COUNT(*) as request_count
             FROM sample_requests sr
             JOIN products p ON sr.product_id = p.id
             GROUP BY sr.product_id
             ORDER BY request_count DESC
             LIMIT 5`
        );

        res.json({
            success: true,
            data: {
                statusStats,
                recentRequests: recentRequests[0].count,
                popularProducts
            }
        });

    } catch (error) {
        console.error('Get sample request stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router; 