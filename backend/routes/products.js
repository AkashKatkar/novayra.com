const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all products (public)
router.get('/', async (req, res) => {
    try {
        const [products] = await pool.execute(
            `SELECT id, name, description, price, stock_quantity, image_url, category, fragrance_notes, bottle_size, is_active 
             FROM products 
             WHERE is_active = TRUE 
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            data: { products }
        });

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get single product by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const productId = req.params.id;

        const [products] = await pool.execute(
            `SELECT id, name, description, price, stock_quantity, image_url, category, fragrance_notes, bottle_size, is_active, created_at 
             FROM products 
             WHERE id = ? AND is_active = TRUE`,
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: { product: products[0] }
        });

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Create new product (admin only)
router.post('/', authenticateToken, requireAdmin, [
    body('name').trim().isLength({ min: 2 }),
    body('description').trim().isLength({ min: 10 }),
    body('price').isFloat({ min: 0 }),
    body('stock_quantity').isInt({ min: 0 }),
    body('image_url').optional().isURL(),
    body('category').optional().trim(),
    body('fragrance_notes').optional().trim(),
    body('bottle_size').optional().trim()
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

        const { name, description, price, stock_quantity, image_url, category, fragrance_notes, bottle_size } = req.body;

        const [result] = await pool.execute(
            `INSERT INTO products (name, description, price, stock_quantity, image_url, category, fragrance_notes, bottle_size) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, description, price, stock_quantity, image_url, category || 'perfume', fragrance_notes, bottle_size]
        );

        // Get the created product
        const [products] = await pool.execute(
            'SELECT * FROM products WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { product: products[0] }
        });

    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update product (admin only)
router.put('/:id', authenticateToken, requireAdmin, [
    body('name').optional().trim().isLength({ min: 2 }),
    body('description').optional().trim().isLength({ min: 10 }),
    body('price').optional().isFloat({ min: 0 }),
    body('stock_quantity').optional().isInt({ min: 0 }),
    body('image_url').optional().isURL(),
    body('category').optional().trim(),
    body('fragrance_notes').optional().trim(),
    body('bottle_size').optional().trim(),
    body('is_active').optional().isBoolean()
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

        const productId = req.params.id;
        const { name, description, price, stock_quantity, image_url, category, fragrance_notes, bottle_size, is_active } = req.body;

        // Check if product exists
        const [existingProducts] = await pool.execute(
            'SELECT id FROM products WHERE id = ?',
            [productId]
        );

        if (existingProducts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (description) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (price !== undefined) {
            updateFields.push('price = ?');
            updateValues.push(price);
        }
        if (stock_quantity !== undefined) {
            updateFields.push('stock_quantity = ?');
            updateValues.push(stock_quantity);
        }
        if (image_url) {
            updateFields.push('image_url = ?');
            updateValues.push(image_url);
        }
        if (category) {
            updateFields.push('category = ?');
            updateValues.push(category);
        }
        if (fragrance_notes) {
            updateFields.push('fragrance_notes = ?');
            updateValues.push(fragrance_notes);
        }
        if (bottle_size) {
            updateFields.push('bottle_size = ?');
            updateValues.push(bottle_size);
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(productId);

        await pool.execute(
            `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // Get updated product
        const [products] = await pool.execute(
            'SELECT * FROM products WHERE id = ?',
            [productId]
        );

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: { product: products[0] }
        });

    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const productId = req.params.id;

        // Check if product exists
        const [existingProducts] = await pool.execute(
            'SELECT id FROM products WHERE id = ?',
            [productId]
        );

        if (existingProducts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Soft delete by setting is_active to false
        await pool.execute(
            'UPDATE products SET is_active = FALSE WHERE id = ?',
            [productId]
        );

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
    try {
        const category = req.params.category;

        const [products] = await pool.execute(
            `SELECT id, name, description, price, stock_quantity, image_url, category, fragrance_notes, bottle_size 
             FROM products 
             WHERE category = ? AND is_active = TRUE 
             ORDER BY created_at DESC`,
            [category]
        );

        res.json({
            success: true,
            data: { products }
        });

    } catch (error) {
        console.error('Get products by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router; 