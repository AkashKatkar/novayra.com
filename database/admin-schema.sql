-- Novayra Admin Dashboard Database Schema Updates
-- Additional tables and modifications for admin functionality

USE novayra_ecommerce;

-- Add admin-specific columns to existing tables if they don't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS admin_notes TEXT AFTER notes,
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100) AFTER admin_notes;

-- Create admin sessions table for secure admin authentication
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at)
);

-- Create product categories table for better organization
CREATE TABLE IF NOT EXISTS product_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT IGNORE INTO product_categories (name, description) VALUES
('Luxury Perfumes', 'Premium fragrances for special occasions'),
('Daily Wear', 'Light fragrances for everyday use'),
('Evening Wear', 'Rich fragrances for evening events'),
('Unisex', 'Fragrances suitable for all genders');

-- Create product images table for multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    alt_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_primary (is_primary)
);

-- Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Create dashboard statistics table for caching
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stat_name VARCHAR(100) UNIQUE NOT NULL,
    stat_value JSON NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample orders for testing admin dashboard
INSERT INTO orders (user_id, order_number, total_amount, status, shipping_address, shipping_city, shipping_state, shipping_postal_code, payment_status, admin_notes) VALUES
(1, 'NOV-2024-001', 9600.00, 'delivered', '123 Luxury Lane, Apartment 4B', 'Mumbai', 'Maharashtra', '400001', 'paid', 'Delivered successfully. Customer satisfied.'),
(1, 'NOV-2024-002', 4200.00, 'processing', '456 Elegance Street, Floor 2', 'Delhi', 'Delhi', '110001', 'paid', 'Processing for shipment.'),
(1, 'NOV-2024-003', 4900.00, 'pending', '789 Premium Road, Unit 7C', 'Bangalore', 'Karnataka', '560001', 'pending', 'Awaiting payment confirmation.');

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) VALUES
(1, 1, 'Midnight Velvet', 4800.00, 2, 9600.00),
(2, 2, 'Emerald Dreams', 4200.00, 1, 4200.00),
(3, 3, 'Rose Gold', 4900.00, 1, 4900.00);

-- Insert sample contact messages
INSERT INTO contact_messages (name, email, phone, subject, message, status) VALUES
('Priya Sharma', 'priya.sharma@email.com', '+91-9876543210', 'Product Inquiry', 'I would like to know more about your Midnight Velvet perfume. Is it suitable for evening wear?', 'new'),
('Rajesh Kumar', 'rajesh.kumar@email.com', '+91-8765432109', 'Bulk Order', 'I am interested in placing a bulk order for corporate gifts. Please provide pricing details.', 'read'),
('Anjali Patel', 'anjali.patel@email.com', '+91-7654321098', 'Return Request', 'I received my order but the bottle was damaged during shipping. How can I get a replacement?', 'replied');

-- Insert sample sample requests
INSERT INTO sample_requests (user_id, product_id, customer_name, customer_email, customer_phone, sample_size, shipping_address, shipping_city, shipping_state, shipping_postal_code, status, admin_notes) VALUES
(1, 1, 'Meera Singh', 'meera.singh@email.com', '+91-6543210987', '5ml', '321 Sample Street, Apartment 1A', 'Chennai', 'Tamil Nadu', '600001', 'approved', 'Sample approved and ready for shipment.'),
(1, 2, 'Vikram Malhotra', 'vikram.malhotra@email.com', '+91-5432109876', '10ml', '654 Test Avenue, Floor 3', 'Hyderabad', 'Telangana', '500001', 'pending', 'Awaiting approval.'),
(1, 3, 'Sneha Reddy', 'sneha.reddy@email.com', '+91-4321098765', '2ml', '987 Demo Road, Unit 5B', 'Pune', 'Maharashtra', '411001', 'shipped', 'Sample shipped via express delivery.');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(price);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_date ON contact_messages(status, created_at);
CREATE INDEX IF NOT EXISTS idx_sample_requests_status_date ON sample_requests(status, created_at);

-- Insert initial dashboard statistics
INSERT INTO dashboard_stats (stat_name, stat_value) VALUES
('total_orders', '{"value": 3, "period": "all_time"}'),
('total_revenue', '{"value": 18700.00, "period": "all_time"}'),
('total_products', '{"value": 4, "period": "all_time"}'),
('pending_orders', '{"value": 1, "period": "current"}'),
('low_stock_products', '{"value": 0, "period": "current"}'),
('new_contacts', '{"value": 1, "period": "current"}'),
('pending_samples', '{"value": 1, "period": "current"}');

-- Grant necessary permissions (run as root/admin)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON novayra_ecommerce.* TO 'novayra_admin'@'localhost';
-- FLUSH PRIVILEGES; 