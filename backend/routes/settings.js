const express = require('express');
const router = express.Router();
const { adminAuth, logAdminActivity } = require('../middleware/adminAuth');
const { pool } = require('../config/database');

// Get all settings
router.get('/', adminAuth, async (req, res) => {
    try {
        const [settings] = await pool.execute(`
            SELECT setting_key, setting_value, setting_type, description, updated_at
            FROM site_settings
            ORDER BY setting_key
        `);

        // Group settings by category
        const groupedSettings = {
            general: [],
            email: [],
            payment: [],
            shipping: [],
            social: [],
            seo: [],
            maintenance: []
        };

        settings.forEach(setting => {
            const category = setting.setting_key.split('_')[0];
            if (groupedSettings[category]) {
                groupedSettings[category].push(setting);
            } else {
                groupedSettings.general.push(setting);
            }
        });

        res.json({
            success: true,
            settings: groupedSettings
        });

    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settings'
        });
    }
});

// Update settings
router.put('/', adminAuth, async (req, res) => {
    try {
        const { settings } = req.body;

        if (!settings || !Array.isArray(settings)) {
            return res.status(400).json({
                success: false,
                message: 'Settings array is required'
            });
        }

        // Update each setting
        for (const setting of settings) {
            const { setting_key, setting_value } = setting;
            
            await pool.execute(`
                UPDATE site_settings 
                SET setting_value = ?, updated_at = NOW()
                WHERE setting_key = ?
            `, [setting_value, setting_key]);
        }

        // Log activity
        await logAdminActivity(
            req.admin.id,
            'UPDATE_SETTINGS',
            'site_settings',
            null,
            { updatedSettings: settings.length },
            req
        );

        res.json({
            success: true,
            message: 'Settings updated successfully'
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings'
        });
    }
});

// Test email configuration
router.post('/test-email', adminAuth, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        // Get email settings
        const [emailSettings] = await pool.execute(`
            SELECT setting_key, setting_value
            FROM site_settings
            WHERE setting_key LIKE 'email_%'
        `);

        const emailConfig = {};
        emailSettings.forEach(setting => {
            emailConfig[setting.setting_key] = setting.setting_value;
        });

        // Here you would implement actual email sending
        // For now, we'll just simulate success
        const testResult = {
            success: true,
            message: 'Test email would be sent to ' + email,
            config: {
                smtp_host: emailConfig.email_smtp_host || 'Not configured',
                smtp_port: emailConfig.email_smtp_port || 'Not configured',
                smtp_user: emailConfig.email_smtp_user || 'Not configured'
            }
        };

        res.json(testResult);

    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test email configuration'
        });
    }
});

// Reset settings to default
router.post('/reset', adminAuth, async (req, res) => {
    try {
        // Reset all settings to default values
        const defaultSettings = [
            { key: 'general_site_name', value: 'Novayra' },
            { key: 'general_site_description', value: 'Luxury Perfume Brand' },
            { key: 'general_contact_email', value: 'contact@novayra.com' },
            { key: 'general_contact_phone', value: '+91-9876543210' },
            { key: 'general_address', value: 'Mumbai, Maharashtra, India' },
            { key: 'email_smtp_host', value: 'smtp.gmail.com' },
            { key: 'email_smtp_port', value: '587' },
            { key: 'email_smtp_user', value: '' },
            { key: 'email_smtp_password', value: '' },
            { key: 'payment_currency', value: 'INR' },
            { key: 'payment_currency_symbol', value: '₹' },
            { key: 'shipping_free_threshold', value: '5000' },
            { key: 'shipping_default_cost', value: '200' },
            { key: 'social_facebook', value: '' },
            { key: 'social_instagram', value: '' },
            { key: 'social_twitter', value: '' },
            { key: 'seo_meta_title', value: 'Novayra - Luxury Perfumes' },
            { key: 'seo_meta_description', value: 'Discover luxury perfumes at Novayra' },
            { key: 'seo_meta_keywords', value: 'perfume, luxury, fragrance, novayra' }
        ];

        for (const setting of defaultSettings) {
            await pool.execute(`
                UPDATE site_settings 
                SET setting_value = ?, updated_at = NOW()
                WHERE setting_key = ?
            `, [setting.value, setting.key]);
        }

        // Log activity
        await logAdminActivity(
            req.admin.id,
            'RESET_SETTINGS',
            'site_settings',
            null,
            { resetSettings: defaultSettings.length },
            req
        );

        res.json({
            success: true,
            message: 'Settings reset to default values'
        });

    } catch (error) {
        console.error('Reset settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset settings'
        });
    }
});

module.exports = router;