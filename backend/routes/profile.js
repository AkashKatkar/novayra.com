const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { authenticateToken } = require('../middleware/auth');

// Get user profile data
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'novayra_ecommerce'
        });

        const [rows] = await connection.execute(
            'SELECT id, email, first_name, last_name, phone, address, city, state, postal_code, country FROM users WHERE id = ?',
            [req.user.id]
        );

        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = rows[0];
        
        // Format the data for checkout form
        const profileData = {
            fullName: `${user.first_name} ${user.last_name}`.trim(),
            phone: user.phone || '',
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            pincode: user.postal_code || '',
            country: user.country || 'India'
        };

        res.json(profileData);

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile data' });
    }
});

// Update user profile data
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { fullName, phone, address, city, state, pincode, country } = req.body;

        // Validate required fields
        if (!fullName || !phone || !address || !city || !state || !pincode) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['fullName', 'phone', 'address', 'city', 'state', 'pincode']
            });
        }

        // Split full name into first and last name
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Validate phone number (Indian format)
        if (!/^[6-9]\d{9}$/.test(phone)) {
            return res.status(400).json({ error: 'Please enter a valid 10-digit phone number' });
        }

        // Validate pincode
        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ error: 'Please enter a valid 6-digit pincode' });
        }

        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'novayra_ecommerce'
        });

        // Update user profile
        await connection.execute(
            `UPDATE users SET 
                first_name = ?, 
                last_name = ?, 
                phone = ?, 
                address = ?, 
                city = ?, 
                state = ?, 
                postal_code = ?, 
                country = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [firstName, lastName, phone, address, city, state, pincode, country || 'India', req.user.id]
        );

        await connection.end();

        res.json({ 
            message: 'Profile updated successfully',
            profile: {
                fullName,
                phone,
                address,
                city,
                state,
                pincode,
                country: country || 'India'
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Save checkout data to profile (auto-save feature)
router.post('/save-checkout-data', authenticateToken, async (req, res) => {
    try {
        const { fullName, phone, address, city, state, pincode, country } = req.body;

        // Validate required fields
        if (!fullName || !phone || !address || !city || !state || !pincode) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['fullName', 'phone', 'address', 'city', 'state', 'pincode']
            });
        }

        // Split full name into first and last name
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'novayra_ecommerce'
        });

        // Update user profile with checkout data
        await connection.execute(
            `UPDATE users SET 
                first_name = ?, 
                last_name = ?, 
                phone = ?, 
                address = ?, 
                city = ?, 
                state = ?, 
                postal_code = ?, 
                country = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [firstName, lastName, phone, address, city, state, pincode, country || 'India', req.user.id]
        );

        await connection.end();

        res.json({ 
            message: 'Checkout data saved to profile successfully',
            saved: true
        });

    } catch (error) {
        console.error('Error saving checkout data:', error);
        res.status(500).json({ error: 'Failed to save checkout data' });
    }
});

module.exports = router; 