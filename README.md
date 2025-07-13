# Novayra E-commerce System

A comprehensive e-commerce platform for Novayra luxury perfumes, featuring user authentication, shopping cart functionality, order management, and sample request system.

## 🌟 Features

### Customer Features
- **User Authentication**: Secure registration and login system
- **Product Catalog**: Browse luxury perfumes with detailed information
- **Shopping Cart**: Add, update, and remove items from cart
- **Order Management**: Place orders with multiple payment options
- **Sample Requests**: Request perfume samples before purchasing
- **Responsive Design**: Mobile-friendly interface with elegant UI

### Admin Features
- **Product Management**: Add, edit, and manage product inventory
- **Order Management**: View and update order statuses
- **Sample Request Management**: Process and track sample requests
- **User Management**: View customer accounts and orders

### Technical Features
- **RESTful API**: Node.js/Express backend with MySQL database
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive form validation and sanitization
- **Security**: CSRF protection, rate limiting, and secure headers
- **Responsive Design**: Modern, elegant UI with smooth animations

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)** - Interactive functionality
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **MySQL** (v8.0 or higher)
- **XAMPP** (for local development)
- **Git** (for version control)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd novayra.com
```

### 2. Database Setup

1. **Start XAMPP** and ensure MySQL service is running
2. **Open phpMyAdmin** (http://localhost/phpmyadmin)
3. **Create a new database** named `novayra_ecommerce`
4. **Import the database schema**:
   ```bash
   mysql -u root -p novayra_ecommerce < database/schema.sql
   ```
   Or copy and paste the contents of `database/schema.sql` into phpMyAdmin's SQL tab.

### 3. Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=novayra_ecommerce
   DB_PORT=3306

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5000
   ```

5. **Start the backend server**:
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000`

### 4. Frontend Setup

1. **Open the project** in your web server (XAMPP's htdocs folder)
2. **Access the website** at `http://localhost/novayra.com`

### 5. Verify Installation

1. **Check API health**: Visit `http://localhost:3000/health`
2. **Test frontend**: Open `http://localhost/novayra.com`
3. **Verify database**: Check that tables are created in phpMyAdmin

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+919876543210"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Product Endpoints

#### Get All Products
```http
GET /api/products
```

#### Get Single Product
```http
GET /api/products/:id
```

### Cart Endpoints

#### Get User Cart
```http
GET /api/cart
Authorization: Bearer <token>
```

#### Add to Cart
```http
POST /api/cart/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}
```

#### Update Cart Item
```http
PUT /api/cart/update/:itemId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove from Cart
```http
DELETE /api/cart/remove/:itemId
Authorization: Bearer <token>
```

### Order Endpoints

#### Place Order
```http
POST /api/orders/place
Authorization: Bearer <token>
Content-Type: application/json

{
  "shipping_address": "123 Main St",
  "shipping_city": "Mumbai",
  "shipping_state": "Maharashtra",
  "shipping_postal_code": "400001",
  "payment_method": "cod"
}
```

#### Get User Orders
```http
GET /api/orders/my-orders
Authorization: Bearer <token>
```

### Sample Request Endpoints

#### Submit Sample Request
```http
POST /api/samples/request
Content-Type: application/json

{
  "product_id": 1,
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+919876543210",
  "sample_size": "5ml",
  "shipping_address": "123 Main St",
  "shipping_city": "Mumbai",
  "shipping_state": "Maharashtra",
  "shipping_postal_code": "400001"
}
```

## 🧪 Testing the System

### 1. User Registration & Login

1. **Open the website** and click the user icon
2. **Register a new account** with your details
3. **Login** with your credentials
4. **Verify** that you're logged in (user icon should show your name)

### 2. Shopping Cart Functionality

1. **Browse products** in the collection section
2. **Click "Add to Cart"** on any product
3. **Open cart** by clicking the cart icon
4. **Modify quantities** using +/- buttons
5. **Remove items** using the trash icon
6. **Verify total** calculation

### 3. Sample Request System

1. **Click "Request Sample"** on any product
2. **Fill out the form** with your details
3. **Submit the request**
4. **Verify** success notification

### 4. Checkout Process

1. **Add items to cart**
2. **Click "Proceed to Checkout"**
3. **Fill shipping information**
4. **Select payment method**
5. **Place order**
6. **Verify** order confirmation

### 5. Admin Functions (Optional)

1. **Login as admin**:
   - Email: `admin@novayra.com`
   - Password: `admin123`

2. **Test admin endpoints** using Postman or similar tool:
   - `GET /api/orders` - View all orders
   - `GET /api/samples` - View sample requests
   - `PUT /api/orders/:id/status` - Update order status

## 🔧 Configuration

### Database Configuration

The system uses MySQL with the following default settings:
- **Host**: localhost
- **Port**: 3306
- **Database**: novayra_ecommerce
- **User**: root (default XAMPP user)

### Security Configuration

- **JWT Secret**: Change the default secret in production
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for localhost development
- **Input Validation**: All user inputs are validated and sanitized

### Email Configuration (Optional)

To enable email notifications, configure SMTP settings in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🚀 Deployment

### Production Deployment

1. **Set up production database**:
   - Use a production MySQL server
   - Create database and import schema
   - Configure secure database credentials

2. **Configure environment variables**:
   - Set `NODE_ENV=production`
   - Use strong JWT secret
   - Configure production database credentials
   - Set up proper CORS origins

3. **Deploy backend**:
   ```bash
   npm install --production
   npm start
   ```

4. **Deploy frontend**:
   - Upload files to web server
   - Update API_BASE_URL in script.js
   - Configure HTTPS

### Security Considerations

- **Change default admin password**
- **Use HTTPS in production**
- **Configure proper CORS origins**
- **Set up rate limiting**
- **Use environment variables for secrets**
- **Regular database backups**

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Ensure MySQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **CORS Errors**:
   - Check FRONTEND_URL in `.env`
   - Ensure frontend and backend ports match

3. **JWT Token Issues**:
   - Clear browser localStorage
   - Check JWT_SECRET in `.env`
   - Verify token expiration

4. **Port Already in Use**:
   - Change PORT in `.env`
   - Kill existing Node.js processes

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in `.env`

## 📝 File Structure

```
novayra.com/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   └── samples.js
│   ├── package.json
│   ├── server.js
│   └── env.example
├── database/
│   └── schema.sql
├── images/
│   ├── emerald-dreams.svg
│   ├── favicon.svg
│   ├── hero-background.svg
│   ├── midnight-velvet.svg
│   ├── perfume-bottles.svg
│   ├── rose-gold.svg
│   └── sapphire-mist.svg
├── index.html
├── styles.css
├── script.js
├── README.md
├── robots.txt
├── sitemap.xml
└── SEO-GUIDE.md
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Email**: hello@novayra.com
- **Phone**: +91 7385183328
- **Address**: 25 Linking Road, Bandra West, Mumbai 400050

## 🔄 Updates

### Version 1.0.0
- Initial release with complete e-commerce functionality
- User authentication and authorization
- Shopping cart and order management
- Sample request system
- Responsive design
- Admin dashboard features

---

**Novayra** - A New Aura of Luxury ✨ 