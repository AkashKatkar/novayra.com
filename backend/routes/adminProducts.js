const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { adminAuth, logAdminActivity } = require('../middleware/adminAuth');
const { pool } = require('../config/database');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'products');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Get all products with pagination and filters
router.get('/', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const search = req.query.search || '';
        const category = req.query.category || '';
        const minPrice = req.query.minPrice || '';
        const maxPrice = req.query.maxPrice || '';
        const stockStatus = req.query.stockStatus || '';

        // Build WHERE clause
        let whereConditions = [];
        let params = [];

        if (search) {
            whereConditions.push(`(name LIKE ? OR description LIKE ? OR fragrance_notes LIKE ?)`);
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        if (category) {
            whereConditions.push('category = ?');
            params.push(category);
        }

        if (minPrice) {
            whereConditions.push('price >= ?');
            params.push(parseFloat(minPrice));
        }

        if (maxPrice) {
            whereConditions.push('price <= ?');
            params.push(parseFloat(maxPrice));
        }

        if (stockStatus === 'in_stock') {
            whereConditions.push('stock_quantity > 0');
        } else if (stockStatus === 'out_of_stock') {
            whereConditions.push('stock_quantity = 0');
        } else if (stockStatus === 'low_stock') {
            whereConditions.push('stock_quantity <= 10 AND stock_quantity > 0');
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Get total count
        const [countResult] = await pool.execute(`
            SELECT COUNT(*) as total
            FROM products
            ${whereClause}
        `, params);

        const totalProducts = countResult[0].total;

        // Get products
        const [products] = await pool.execute(`
            SELECT 
                id,
                name,
                description,
                price,
                stock_quantity,
                image_url,
                category,
                fragrance_notes,
                bottle_size,
                is_active,
                created_at,
                updated_at
            FROM products
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Get categories for filter
        const [categories] = await pool.execute(`
            SELECT DISTINCT category 
            FROM products 
            WHERE category IS NOT NULL AND category != ''
            ORDER BY category
        `);

        res.json({
            success: true,
            products,
            categories: categories.map(c => c.category),
            pagination: {
                page,
                limit,
                total: totalProducts,
                pages: Math.ceil(totalProducts / limit)
            }
        });

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get products'
        });
    }
});

// Get single product by ID
router.get('/:id', adminAuth, async (req, res) => {
    try {
        const productId = parseInt(req.params.id);

        const [products] = await pool.execute(`
            SELECT *
            FROM products
            WHERE id = ?
        `, [productId]);

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const product = products[0];

        // Get product images
        const [images] = await pool.execute(`
            SELECT *
            FROM product_images
            WHERE product_id = ?
            ORDER BY is_primary DESC, created_at ASC
        `, [productId]);

        product.images = images;

        res.json({
            success: true,
            product
        });

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get product'
        });
    }
});

// Create new product
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            stockQuantity,
            category,
            fragranceNotes,
            bottleSize
        } = req.body;

        // Validation
        if (!name || !price || !stockQuantity) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, and stock quantity are required'
            });
        }

        if (parseFloat(price) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be greater than 0'
            });
        }

        if (parseInt(stockQuantity) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock quantity cannot be negative'
            });
        }

        // Handle image upload
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/products/${req.file.filename}`;
        }

        // Insert product
        const [result] = await pool.execute(`
            INSERT INTO products (
                name, description, price, stock_quantity, image_url, 
                category, fragrance_notes, bottle_size
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, description, parseFloat(price), parseInt(stockQuantity), 
            imageUrl, category, fragranceNotes, bottleSize
        ]);

        const productId = result.insertId;

        // Log activity
        await logAdminActivity(
            req.admin.id,
            'CREATE_PRODUCT',
            'products',
            productId,
            { name, price, stockQuantity, category },
            req
        );

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            productId
        });

    } catch (error) {
        console.error('Create product error:', error);
        
        // Clean up uploaded file if database insert failed
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Failed to delete uploaded file:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create product'
        });
    }
});

// Update product
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const {
            name,
            description,
            price,
            stockQuantity,
            category,
            fragranceNotes,
            bottleSize,
            isActive
        } = req.body;

        // Check if product exists
        const [existingProducts] = await pool.execute(
            'SELECT image_url FROM products WHERE id = ?',
            [productId]
        );

        if (existingProducts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const existingProduct = existingProducts[0];

        // Validation
        if (!name || !price || !stockQuantity) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, and stock quantity are required'
            });
        }

        if (parseFloat(price) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be greater than 0'
            });
        }

        if (parseInt(stockQuantity) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock quantity cannot be negative'
            });
        }

        // Handle image upload
        let imageUrl = existingProduct.image_url;
        if (req.file) {
            // Delete old image if exists
            if (existingProduct.image_url) {
                try {
                    const oldImagePath = path.join(__dirname, '..', '..', existingProduct.image_url);
                    await fs.unlink(oldImagePath);
                } catch (error) {
                    console.error('Failed to delete old image:', error);
                }
            }
            imageUrl = `/uploads/products/${req.file.filename}`;
        }

        // Update product
        await pool.execute(`
            UPDATE products 
            SET name = ?, description = ?, price = ?, stock_quantity = ?, 
                image_url = ?, category = ?, fragrance_notes = ?, bottle_size = ?, 
                is_active = ?, updated_at = NOW()
            WHERE id = ?
        `, [
            name, description, parseFloat(price), parseInt(stockQuantity),
            imageUrl, category, fragranceNotes, bottleSize, 
            isActive === 'true' || isActive === true, productId
        ]);

        // Log activity
        await logAdminActivity(
            req.admin.id,
            'UPDATE_PRODUCT',
            'products',
            productId,
            { name, price, stockQuantity, category },
            req
        );

        res.json({
            success: true,
            message: 'Product updated successfully'
        });

    } catch (error) {
        console.error('Update product error:', error);
        
        // Clean up uploaded file if database update failed
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Failed to delete uploaded file:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update product'
        });
    }
});

// Delete product
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const productId = parseInt(req.params.id);

        // Check if product exists and get image URL
        const [products] = await pool.execute(
            'SELECT image_url FROM products WHERE id = ?',
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const product = products[0];

        // Check if product is in any orders
        const [orderItems] = await pool.execute(
            'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?',
            [productId]
        );

        if (orderItems[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete product that has been ordered'
            });
        }

        // Delete product images from database
        await pool.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);

        // Delete product
        await pool.execute('DELETE FROM products WHERE id = ?', [productId]);

        // Delete image file if exists
        if (product.image_url) {
            try {
                const imagePath = path.join(__dirname, '..', '..', product.image_url);
                await fs.unlink(imagePath);
            } catch (error) {
                console.error('Failed to delete image file:', error);
            }
        }

        // Log activity
        await logAdminActivity(
            req.admin.id,
            'DELETE_PRODUCT',
            'products',
            productId,
            { productName: product.name },
            req
        );

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product'
        });
    }
});

// Upload additional product images
router.post('/:id/images', adminAuth, upload.array('images', 5), async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { altTexts } = req.body;

        // Check if product exists
        const [products] = await pool.execute(
            'SELECT id FROM products WHERE id = ?',
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No images uploaded'
            });
        }

        const uploadedImages = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const imageUrl = `/uploads/products/${file.filename}`;
            const altText = altTexts && altTexts[i] ? altTexts[i] : null;

            // Insert image record
            const [result] = await pool.execute(`
                INSERT INTO product_images (product_id, image_url, alt_text)
                VALUES (?, ?, ?)
            `, [productId, imageUrl, altText]);

            uploadedImages.push({
                id: result.insertId,
                imageUrl,
                altText
            });
        }

        res.json({
            success: true,
            message: 'Images uploaded successfully',
            images: uploadedImages
        });

    } catch (error) {
        console.error('Upload images error:', error);
        
        // Clean up uploaded files if database insert failed
        if (req.files) {
            for (const file of req.files) {
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('Failed to delete uploaded file:', unlinkError);
                }
            }
        }

        res.status(500).json({
            success: false,
            message: 'Failed to upload images'
        });
    }
});

// Get product statistics
router.get('/stats/summary', adminAuth, async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as in_stock,
                COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock,
                COUNT(CASE WHEN stock_quantity <= 10 AND stock_quantity > 0 THEN 1 END) as low_stock,
                COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_products,
                AVG(price) as avg_price,
                SUM(stock_quantity) as total_stock
            FROM products
        `);

        // Get category distribution
        const [categories] = await pool.execute(`
            SELECT 
                category,
                COUNT(*) as count,
                AVG(price) as avg_price
            FROM products
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category
            ORDER BY count DESC
        `);

        res.json({
            success: true,
            stats: stats[0],
            categories
        });

    } catch (error) {
        console.error('Product stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get product statistics'
        });
    }
});

module.exports = router; 