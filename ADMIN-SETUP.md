# Novayra Admin Dashboard Setup Guide

## Overview
This guide will help you set up and configure the Novayra luxury perfume e-commerce admin dashboard. The admin dashboard provides comprehensive order and product management capabilities with a modern, professional interface.

## Prerequisites
- XAMPP installed and running (Apache + MySQL)
- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation Steps

### 1. Database Setup

1. **Start XAMPP**
   - Open XAMPP Control Panel
   - Start Apache and MySQL services
   - Ensure both services are running (green status)

2. **Create Database**
   - Open phpMyAdmin: http://localhost/phpmyadmin
   - Create a new database named `novayra_ecommerce`
   - Import the database schema:
     - Go to the `database` folder in your project
     - Import `schema.sql` first
     - Then import `admin-schema.sql` for admin-specific tables

3. **Verify Database Tables**
   After import, you should have these tables:
   - `users` (includes admin user)
   - `products` (perfume inventory)
   - `orders` (customer orders)
   - `order_items` (items within orders)
   - `cart_items` (shopping cart)
   - `sample_requests` (perfume sample requests)
   - `contact_messages` (contact form submissions)
   - `admin_sessions` (admin authentication)
   - `product_categories` (product organization)
   - `product_images` (product images)
   - `admin_activity_log` (admin activity tracking)
   - `dashboard_stats` (cached statistics)

### 2. Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   - Copy `env.example` to `.env` in the backend folder
   - Update the `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=novayra_ecommerce
   DB_PORT=3306
   NODE_ENV=development
   PORT=3000
   ```

3. **Start Backend Server**
   ```bash
   npm start
   ```
   You should see:
   ```
   🚀 Novayra E-commerce Server Started!
   =====================================
   📍 Server running on: http://localhost:3000
   🌐 Frontend: http://localhost:3000
   🔌 API Base: http://localhost:3000/api
   💾 Database: Connected successfully
   🔒 Environment: development
   =====================================
   ```

### 3. Frontend Setup

1. **Access Admin Dashboard**
   - Open your browser and go to: http://localhost:3000/admin-login.html
   - Or navigate from the main site: http://localhost:3000

2. **Admin Login Credentials**
   - **Email:** admin@novayra.com
   - **Password:** admin123

## Features Overview

### 1. Order Management
- **View All Orders:** Complete list with pagination and filters
- **Order Details:** Customer info, items, shipping, payment status
- **Status Updates:** Change order status (Pending → Processing → Shipped → Delivered)
- **Payment Management:** Update payment status
- **Admin Notes:** Add internal notes for order tracking
- **Search & Filter:** By order ID, customer name, status, date range

### 2. Product Management
- **Product Listing:** View all products with stock levels
- **Add Products:** Create new perfume entries with images
- **Edit Products:** Update product details, prices, stock
- **Delete Products:** Remove products (with safety checks)
- **Image Upload:** Multiple image support with validation
- **Stock Management:** Track inventory levels and low stock alerts

### 3. Dashboard Analytics
- **Statistics Cards:** Total orders, revenue, pending orders, products
- **Recent Orders:** Latest 5 orders with quick actions
- **Low Stock Alerts:** Products with stock ≤ 10 units
- **Activity Log:** Track all admin actions
- **Revenue Tracking:** Monthly revenue charts

## Testing Instructions

### 1. Authentication Testing
1. **Login Test**
   - Go to http://localhost:3000/admin-login.html
   - Enter credentials: admin@novayra.com / admin123
   - Verify successful login and redirect to dashboard

2. **Session Management**
   - Refresh the page - should stay logged in
   - Close browser and reopen - should redirect to login
   - Test logout functionality

### 2. Dashboard Testing
1. **Statistics Loading**
   - Verify all stat cards display correct numbers
   - Check that numbers match database records
   - Test refresh functionality

2. **Recent Orders**
   - Verify recent orders table loads
   - Check order details are accurate
   - Test "View All" navigation

3. **Low Stock Products**
   - Verify low stock table displays
   - Check stock numbers are correct
   - Test "View All" navigation

### 3. Order Management Testing
1. **Order Listing**
   - Navigate to Orders section
   - Verify all orders display with correct information
   - Test pagination if more than 20 orders

2. **Order Details**
   - Click "View" on any order
   - Verify customer information is correct
   - Check order items and totals

3. **Status Updates**
   - Test changing order status
   - Verify status changes are saved
   - Check activity log records the change

4. **Search & Filter**
   - Test search by order number
   - Test filter by status
   - Test date range filtering

### 4. Product Management Testing
1. **Product Listing**
   - Navigate to Products section
   - Verify all products display
   - Check images load correctly

2. **Add Product**
   - Click "Add Product"
   - Fill in all required fields
   - Upload a test image
   - Verify product is created

3. **Edit Product**
   - Click "Edit" on any product
   - Modify details and save
   - Verify changes are applied

4. **Delete Product**
   - Test delete functionality
   - Verify confirmation dialog
   - Check product is removed

### 5. Image Upload Testing
1. **Valid Images**
   - Test uploading JPG, PNG, WebP images
   - Verify images are stored correctly
   - Check file size limits (5MB)

2. **Invalid Files**
   - Test uploading non-image files
   - Verify error handling
   - Check file type validation

## Security Features

### 1. Authentication
- Secure admin login with bcrypt password hashing
- Session-based authentication with tokens
- Automatic session expiration (24 hours)
- Secure logout with session cleanup

### 2. Authorization
- Role-based access control (admin only)
- Protected API endpoints
- Session verification on all admin routes

### 3. Input Validation
- SQL injection prevention with parameterized queries
- XSS protection with input sanitization
- File upload validation and restrictions
- CSRF protection through tokens

### 4. Activity Logging
- All admin actions are logged
- IP address and user agent tracking
- Detailed audit trail for compliance

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure MySQL is running in XAMPP
   - Check database credentials in `.env`
   - Verify database `novayra_ecommerce` exists

2. **Admin Login Fails**
   - Check admin user exists in database
   - Verify password hash is correct
   - Check browser console for errors

3. **Images Not Loading**
   - Ensure `uploads/products` directory exists
   - Check file permissions
   - Verify image paths in database

4. **API Errors**
   - Check server is running on port 3000
   - Verify CORS configuration
   - Check browser network tab for errors

### Debug Mode
Enable debug logging by setting in `.env`:
```env
NODE_ENV=development
DEBUG=true
```

## File Structure

```
novayra.com/
├── admin-login.html          # Admin login page
├── admin-dashboard.html      # Main admin dashboard
├── backend/
│   ├── routes/
│   │   ├── admin.js         # Admin authentication routes
│   │   ├── adminOrders.js   # Order management routes
│   │   └── adminProducts.js # Product management routes
│   ├── middleware/
│   │   └── adminAuth.js     # Admin authentication middleware
│   ├── config/
│   │   └── database.js      # Database configuration
│   └── server.js            # Main server file
├── database/
│   ├── schema.sql           # Main database schema
│   └── admin-schema.sql     # Admin-specific schema
└── uploads/
    └── products/            # Product image uploads
```

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/verify` - Verify session
- `GET /api/admin/profile` - Get admin profile

### Dashboard
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/dashboard/activity` - Recent activity
- `GET /api/admin/dashboard/recent-orders` - Recent orders
- `GET /api/admin/dashboard/low-stock` - Low stock products

### Orders
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/orders/:id` - Get order details
- `PATCH /api/admin/orders/:id/status` - Update order status
- `PATCH /api/admin/orders/:id/payment` - Update payment status
- `PATCH /api/admin/orders/:id/notes` - Add admin notes

### Products
- `GET /api/admin/products` - List all products
- `GET /api/admin/products/:id` - Get product details
- `POST /api/admin/products` - Create new product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `POST /api/admin/products/:id/images` - Upload product images

## Performance Optimization

1. **Database Indexing**
   - All frequently queried columns are indexed
   - Composite indexes for complex queries
   - Regular index maintenance recommended

2. **Caching**
   - Dashboard statistics are cached
   - Session data cached in memory
   - Image caching with proper headers

3. **File Uploads**
   - Image compression and optimization
   - File size limits enforced
   - Secure file storage

## Maintenance

### Regular Tasks
1. **Database Backup**
   - Daily automated backups recommended
   - Test restore procedures monthly

2. **Log Rotation**
   - Monitor activity logs
   - Archive old logs quarterly

3. **Security Updates**
   - Keep Node.js and dependencies updated
   - Monitor for security vulnerabilities

### Monitoring
- Check server logs for errors
- Monitor database performance
- Track admin activity patterns
- Review failed login attempts

## Support

For technical support or questions:
1. Check the troubleshooting section above
2. Review server logs for error details
3. Verify all prerequisites are met
4. Test with sample data first

## License

This admin dashboard is part of the Novayra e-commerce system and follows the same licensing terms as the main project. 