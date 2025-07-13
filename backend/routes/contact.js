const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// Submit contact form
router.post('/submit', [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    body('phone').trim().isLength({ min: 10, max: 15 }).withMessage('Please provide a valid phone number'),
    body('subject').trim().isLength({ min: 1, max: 50 }).withMessage('Subject is required'),
    body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters')
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

        const { name, email, phone, subject, message } = req.body;

        // Insert contact message into database
        const [result] = await pool.execute(
            'INSERT INTO contact_messages (name, email, phone, subject, message, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone, subject, message, 'new']
        );

        // Log the contact submission for admin notification
        console.log(`New contact form submission from ${name} (${email}) - Subject: ${subject}`);

        res.status(201).json({
            success: true,
            message: 'Contact message submitted successfully',
            data: {
                id: result.insertId,
                submitted_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Contact form submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
});

// Get all contact messages (admin only - would need authentication)
router.get('/messages', async (req, res) => {
    try {
        const [messages] = await pool.execute(
            `SELECT id, name, email, phone, subject, message, status, created_at 
             FROM contact_messages 
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            data: {
                messages,
                total: messages.length
            }
        });

    } catch (error) {
        console.error('Get contact messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update message status (admin only - would need authentication)
router.put('/messages/:id/status', [
    body('status').isIn(['new', 'read', 'replied', 'closed']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const messageId = req.params.id;
        const { status } = req.body;

        const [result] = await pool.execute(
            'UPDATE contact_messages SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, messageId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            message: 'Message status updated successfully'
        });

    } catch (error) {
        console.error('Update message status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router; 