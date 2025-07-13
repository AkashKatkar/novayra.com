# 🚀 Novayra E-commerce - Quick Start Guide

## ✅ **Single Server Setup (Recommended)**

You can now run your entire project from the main directory with **one command**!

### **Step 1: Start XAMPP**
1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL**
3. Ensure both show green status

### **Step 2: Start the Project**
Choose one of these methods:

#### **Method A: Automated Start (Windows)**
```bash
start-project.bat
```

#### **Method B: Manual Start**
```bash
npm install          # Only first time
npm start
```

#### **Method C: Development Mode**
```bash
npm run dev          # Auto-restart on file changes
```

### **Step 3: Access Your Application**
- 🌐 **Frontend**: http://localhost:3000
- 🔌 **API**: http://localhost:3000/api
- 📊 **Health Check**: http://localhost:3000/api/health

---

## 🎯 **What This Setup Provides**

### **Single Server Benefits:**
- ✅ **One command** to start everything
- ✅ **No need** for separate frontend/backend servers
- ✅ **Automatic** static file serving
- ✅ **Built-in** API endpoints
- ✅ **Database** connectivity
- ✅ **Security** features (CORS, rate limiting, helmet)

### **Features Available:**
- 🛒 **Shopping Cart** functionality
- 👤 **User Authentication** (login/register)
- 📦 **Product Management**
- 🛍️ **Order Processing**
- 🎁 **Sample Requests**
- 💳 **Checkout System**

---

## 🔧 **Troubleshooting**

### **If you get "Database connection failed":**
1. Make sure MySQL is running in XAMPP
2. Check if database `novayra_ecommerce` exists in phpMyAdmin
3. Run: `mysql -u root -p novayra_ecommerce < database/schema.sql`

### **If you get "Port 3000 already in use":**
1. Stop other Node.js servers
2. Or change port in `backend/.env` file

### **If you get "Module not found":**
1. Run: `npm install`
2. Make sure you're in the main directory

---

## 📁 **Project Structure**

```
novayra.com/
├── server.js              # Main server file
├── package.json           # Dependencies
├── index.html             # Frontend
├── styles.css             # Styling
├── script.js              # Frontend logic
├── backend/               # Backend code
│   ├── routes/           # API routes
│   ├── config/           # Database config
│   └── .env              # Environment variables
├── images/               # Product images
└── start-project.bat     # Windows start script
```

---

## 🚀 **Alternative Methods**

### **Method 1: Separate Servers (Old Way)**
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
python -m http.server 8000
```

### **Method 2: XAMPP Only (PHP)**
- Move files to `htdocs/`
- Use PHP for database operations
- Access via `http://localhost/novayra.com/`

---

## 🎉 **You're Ready!**

Your Novayra e-commerce platform is now running with:
- ✅ **Database** connected
- ✅ **Frontend** served
- ✅ **API** endpoints active
- ✅ **Security** features enabled
- ✅ **All features** working

Visit **http://localhost:3000** to see your application!

---

## 📞 **Need Help?**

If you encounter any issues:
1. Check the console output for error messages
2. Ensure XAMPP MySQL is running
3. Verify database exists in phpMyAdmin
4. Check the troubleshooting section above 