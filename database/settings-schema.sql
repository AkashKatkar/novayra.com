-- Site Settings Table for Novayra E-commerce
-- This table stores all configurable site settings

USE novayra_ecommerce;

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('text', 'number', 'email', 'url', 'textarea', 'boolean', 'select') DEFAULT 'text',
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key),
    INDEX idx_category (category)
);

-- Insert default settings
INSERT IGNORE INTO site_settings (setting_key, setting_value, setting_type, description, category) VALUES
-- General Settings
('general_site_name', 'Novayra', 'text', 'Website name displayed throughout the site', 'general'),
('general_site_description', 'Luxury Perfume Brand', 'textarea', 'Brief description of the website', 'general'),
('general_contact_email', 'contact@novayra.com', 'email', 'Primary contact email address', 'general'),
('general_contact_phone', '+91-9876543210', 'text', 'Primary contact phone number', 'general'),
('general_address', 'Mumbai, Maharashtra, India', 'textarea', 'Business address', 'general'),
('general_timezone', 'Asia/Kolkata', 'select', 'Default timezone for the application', 'general'),

-- Email Settings
('email_smtp_host', 'smtp.gmail.com', 'text', 'SMTP server hostname', 'email'),
('email_smtp_port', '587', 'number', 'SMTP server port', 'email'),
('email_smtp_user', '', 'email', 'SMTP username/email', 'email'),
('email_smtp_password', '', 'text', 'SMTP password', 'email'),
('email_from_name', 'Novayra Support', 'text', 'Sender name for emails', 'email'),
('email_from_address', 'noreply@novayra.com', 'email', 'Sender email address', 'email'),

-- Payment Settings
('payment_currency', 'INR', 'select', 'Default currency for transactions', 'payment'),
('payment_currency_symbol', '₹', 'text', 'Currency symbol', 'payment'),
('payment_gateway', 'razorpay', 'select', 'Default payment gateway', 'payment'),
('payment_test_mode', 'true', 'boolean', 'Enable test mode for payments', 'payment'),

-- Shipping Settings
('shipping_free_threshold', '5000', 'number', 'Order amount for free shipping (in INR)', 'shipping'),
('shipping_default_cost', '200', 'number', 'Default shipping cost (in INR)', 'shipping'),
('shipping_express_cost', '500', 'number', 'Express shipping cost (in INR)', 'shipping'),
('shipping_delivery_days', '3-5', 'text', 'Standard delivery time', 'shipping'),

-- Social Media Settings
('social_facebook', '', 'url', 'Facebook page URL', 'social'),
('social_instagram', '', 'url', 'Instagram profile URL', 'social'),
('social_twitter', '', 'url', 'Twitter profile URL', 'social'),
('social_youtube', '', 'url', 'YouTube channel URL', 'social'),

-- SEO Settings
('seo_meta_title', 'Novayra - Luxury Perfumes', 'text', 'Default page title', 'seo'),
('seo_meta_description', 'Discover luxury perfumes at Novayra', 'textarea', 'Default page description', 'seo'),
('seo_meta_keywords', 'perfume, luxury, fragrance, novayra', 'textarea', 'Default page keywords', 'seo'),
('seo_google_analytics', '', 'text', 'Google Analytics tracking ID', 'seo'),

-- Maintenance Settings
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', 'maintenance'),
('maintenance_message', 'We are currently performing maintenance. Please check back soon.', 'textarea', 'Maintenance mode message', 'maintenance');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_settings_category ON site_settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_public ON site_settings(is_public); 