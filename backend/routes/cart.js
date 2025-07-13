const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [cartItems] = await pool.execute(
            `SELECT ci.id, ci.quantity, ci.created_at,
                    p.id as product_id, p.name, p.description, p.price, p.image_url, p.stock_quantity, p.fragrance_notes, p.bottle_size
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.user_id = ? AND p.is_active = TRUE
             ORDER BY ci.created_at DESC`,
            [userId]
        );

        // Calculate totals
        let totalItems = 0;
        let totalAmount = 0;

        cartItems.forEach(item => {
            totalItems += item.quantity;
            totalAmount += item.price * item.quantity;
        });

        res.json({
            success: true,
            data: {
                items: cartItems,
                summary: {
                    totalItems,
                    totalAmount: parseFloat(totalAmount.toFixed(2))
                }
            }
        });

    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Add item to cart
router.post('/add', authenticateToken, [
    body('product_id').isInt({ min: 1 }),
    body('quantity').isInt({ min: 1, max: 10 })
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
        const { product_id, quantity } = req.body;

        // Check if product exists and is active
        const [products] = await pool.execute(
            'SELECT id, name, price, stock_quantity FROM products WHERE id = ? AND is_active = TRUE',
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or unavailable'
            });
        }

        const product = products[0];

        // Check stock availability
        if (product.stock_quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock_quantity} items available in stock`
            });
        }

        // Check if item already exists in cart
        const [existingItems] = await pool.execute(
            'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
            [userId, product_id]
        );

        if (existingItems.length > 0) {
            // Update existing item quantity
            const newQuantity = existingItems[0].quantity + quantity;
            
            if (newQuantity > product.stock_quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add more items. Only ${product.stock_quantity} items available in stock`
                });
            }

            await pool.execute(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [newQuantity, existingItems[0].id]
            );

            res.json({
                success: true,
                message: 'Cart updated successfully',
                data: { quantity: newQuantity }
            });
        } else {
            // Add new item to cart
            await pool.execute(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, product_id, quantity]
            );

            res.status(201).json({
                success: true,
                message: 'Item added to cart successfully',
                data: { quantity }
            });
        }

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update cart item quantity
router.put('/update/:itemId', authenticateToken, [
    body('quantity').isInt({ min: 1, max: 10 })
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
        const itemId = req.params.itemId;
        const { quantity } = req.body;

        // Check if cart item exists and belongs to user
        const [cartItems] = await pool.execute(
            `SELECT ci.id, ci.quantity, p.stock_quantity, p.name
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.id = ? AND ci.user_id = ? AND p.is_active = TRUE`,
            [itemId, userId]
        );

        if (cartItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        const cartItem = cartItems[0];

        // Check stock availability
        if (quantity > cartItem.stock_quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${cartItem.stock_quantity} items available in stock for ${cartItem.name}`
            });
        }

        // Update quantity
        await pool.execute(
            'UPDATE cart_items SET quantity = ? WHERE id = ?',
            [quantity, itemId]
        );

        res.json({
            success: true,
            message: 'Cart item updated successfully',
            data: { quantity }
        });

    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Remove item from cart
router.delete('/remove/:itemId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const itemId = req.params.itemId;

        // Check if cart item exists and belongs to user
        const [cartItems] = await pool.execute(
            'SELECT id FROM cart_items WHERE id = ? AND user_id = ?',
            [itemId, userId]
        );

        if (cartItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        // Remove item from cart
        await pool.execute(
            'DELETE FROM cart_items WHERE id = ?',
            [itemId]
        );

        res.json({
            success: true,
            message: 'Item removed from cart successfully'
        });

    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Clear entire cart
router.delete('/clear', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.execute(
            'DELETE FROM cart_items WHERE user_id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Cart cleared successfully'
        });

    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get cart summary (count and total)
router.get('/summary', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [cartItems] = await pool.execute(
            `SELECT ci.quantity, p.price
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.user_id = ? AND p.is_active = TRUE`,
            [userId]
        );

        let totalItems = 0;
        let totalAmount = 0;

        cartItems.forEach(item => {
            totalItems += item.quantity;
            totalAmount += item.price * item.quantity;
        });

        res.json({
            success: true,
            data: {
                totalItems,
                totalAmount: parseFloat(totalAmount.toFixed(2))
            }
        });

    } catch (error) {
        console.error('Get cart summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router; 