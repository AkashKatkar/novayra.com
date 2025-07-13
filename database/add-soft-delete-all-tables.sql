-- Add Soft Delete Support to All Tables
-- This migration adds deleted_at columns to tables that need soft delete functionality

USE novayra_ecommerce;

-- Add soft delete to cart_items table
ALTER TABLE cart_items 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_deleted_at (deleted_at);

-- Add soft delete to orders table
ALTER TABLE orders 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_deleted_at (deleted_at);

-- Add soft delete to order_items table
ALTER TABLE order_items 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_deleted_at (deleted_at);

-- Add soft delete to sample_requests table
ALTER TABLE sample_requests 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_deleted_at (deleted_at);

-- Add soft delete to contact_messages table
ALTER TABLE contact_messages 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_deleted_at (deleted_at);

-- Add soft delete to users table (for admin management)
ALTER TABLE users 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_deleted_at (deleted_at);

-- Add soft delete to product_images table (if it exists)
-- Note: This table might not exist yet, so we'll check first
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'novayra_ecommerce' AND TABLE_NAME = 'product_images') > 0,
    'ALTER TABLE product_images ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL, ADD INDEX idx_deleted_at (deleted_at);',
    'SELECT "product_images table does not exist, skipping" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add soft delete to admin_sessions table (if it exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'novayra_ecommerce' AND TABLE_NAME = 'admin_sessions') > 0,
    'ALTER TABLE admin_sessions ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL, ADD INDEX idx_deleted_at (deleted_at);',
    'SELECT "admin_sessions table does not exist, skipping" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing queries to exclude soft deleted records
-- This ensures that existing queries don't show deleted records

-- Update cart_items queries to exclude deleted records
-- (This will be handled in the application code)

-- Update orders queries to exclude deleted records  
-- (This will be handled in the application code)

-- Update sample_requests queries to exclude deleted records
-- (This will be handled in the application code)

-- Update contact_messages queries to exclude deleted records
-- (This will be handled in the application code)

-- Update users queries to exclude deleted records
-- (This will be handled in the application code)

SELECT 'Soft delete columns added successfully to all tables!' as result; 