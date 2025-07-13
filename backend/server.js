const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const sampleRoutes = require('./routes/samples');
const contactRoutes = require('./routes/contact');
const profileRoutes = require('./routes/profile');

// Import admin routes
const adminRoutes = require('./routes/admin');
const adminOrderRoutes = require('./routes/adminOrders');
const adminProductRoutes = require('./routes/adminProducts');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8000', 'http://localhost:5500', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static files from root directory (main folder)
app.use(express.static(path.join(__dirname, '..')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Novayra E-commerce API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/samples', sampleRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/profile', profileRoutes);

// Admin API routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/products', adminProductRoutes);

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Serve index.html for all other routes
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.errors
        });
    }
    
    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized access'
        });
    }
    
    // Default error response
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
});

// Start server
async function startServer() {
    try {
        // Test database connection
        await testConnection();
        
        // Initialize database
        await initializeDatabase();
        
        // Start listening
        app.listen(PORT, () => {
            console.log('🚀 Novayra E-commerce Server Started!');
            console.log('=====================================');
            console.log(`📍 Server running on: http://localhost:${PORT}`);
            console.log(`🌐 Frontend: http://localhost:${PORT}`);
            console.log(`🔌 API Base: http://localhost:${PORT}/api`);
            console.log(`💾 Database: Connected successfully`);
            console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('=====================================');
            console.log('📱 You can now access your application!');
            console.log('🛒 Features: Shopping Cart, User Auth, Orders, Sample Requests');
            console.log('=====================================');
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure MySQL is running in XAMPP');
        console.log('2. Check your .env file in backend folder');
        console.log('3. Ensure database "novayra_ecommerce" exists');
        console.log('4. Run: npm test to test connection');
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Start the server
startServer(); 