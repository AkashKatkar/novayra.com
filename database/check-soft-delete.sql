-- Check and add soft delete columns if they don't exist
USE novayra_ecommerce;

-- Check if deleted_at column exists in products table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'novayra_ecommerce' 
     AND TABLE_NAME = 'products' 
     AND COLUMN_NAME = 'deleted_at') > 0,
    'SELECT "deleted_at column already exists in products table" as message;',
    'ALTER TABLE products ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL, ADD INDEX idx_deleted (deleted_at);'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if deleted_at column exists in cart_items table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'novayra_ecommerce' 
     AND TABLE_NAME = 'cart_items' 
     AND COLUMN_NAME = 'deleted_at') > 0,
    'SELECT "deleted_at column already exists in cart_items table" as message;',
    'ALTER TABLE cart_items ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL, ADD INDEX idx_deleted_at (deleted_at);'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if deleted_at column exists in orders table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'novayra_ecommerce' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'deleted_at') > 0,
    'SELECT "deleted_at column already exists in orders table" as message;',
    'ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL, ADD INDEX idx_deleted_at (deleted_at);'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if deleted_at column exists in order_items table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'novayra_ecommerce' 
     AND TABLE_NAME = 'order_items' 
     AND COLUMN_NAME = 'deleted_at') > 0,
    'SELECT "deleted_at column already exists in order_items table" as message;',
    'ALTER TABLE order_items ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL, ADD INDEX idx_deleted_at (deleted_at);'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if deleted_at column exists in users table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'novayra_ecommerce' 
     AND TABLE_NAME = 'users' 
     AND COLUMN_NAME = 'deleted_at') > 0,
    'SELECT "deleted_at column already exists in users table" as message;',
    'ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL, ADD INDEX idx_deleted_at (deleted_at);'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if deleted_at column exists in sample_requests table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'novayra_ecommerce' 
     AND TABLE_NAME = 'sample_requests' 
     AND COLUMN_NAME = 'deleted_at') > 0,
    'SELECT "deleted_at column already exists in sample_requests table" as message;',
    'ALTER TABLE sample_requests ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL, ADD INDEX idx_deleted_at (deleted_at);'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if deleted_at column exists in contact_messages table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'novayra_ecommerce' 
     AND TABLE_NAME = 'contact_messages' 
     AND COLUMN_NAME = 'deleted_at') > 0,
    'SELECT "deleted_at column already exists in contact_messages table" as message;',
    'ALTER TABLE contact_messages ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL, ADD INDEX idx_deleted_at (deleted_at);'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show current status
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CASE 
        WHEN COLUMN_NAME = 'deleted_at' THEN 'Soft Delete Ready'
        ELSE 'Standard Column'
    END as status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'novayra_ecommerce' 
AND TABLE_NAME IN ('products', 'cart_items', 'orders', 'order_items', 'users', 'sample_requests', 'contact_messages')
AND COLUMN_NAME = 'deleted_at'
ORDER BY TABLE_NAME;

SELECT 'Soft delete columns check completed!' as result; 