const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || 
                     req.cookies?.adminToken ||
                     req.query.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Admin authentication required'
            });
        }

        // Check if session exists and is valid
        const [sessions] = await pool.execute(
            `SELECT admin_id, expires_at 
             FROM admin_sessions 
             WHERE session_token = ? AND expires_at > NOW()`,
            [token]
        );

        if (sessions.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired session'
            });
        }

        const session = sessions[0];

        // Get admin user details
        const [admins] = await pool.execute(
            `SELECT id, email, first_name, last_name, is_admin 
             FROM users 
             WHERE id = ? AND is_admin = TRUE`,
            [session.admin_id]
        );

        if (admins.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Admin access denied'
            });
        }

        // Attach admin info to request
        req.admin = admins[0];
        req.sessionToken = token;
        next();

    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Admin login function
const adminLogin = async (email, password) => {
    try {
        // Get admin user
        const [users] = await pool.execute(
            `SELECT id, email, password_hash, first_name, last_name, is_admin 
             FROM users 
             WHERE email = ? AND is_admin = TRUE`,
            [email]
        );

        if (users.length === 0) {
            return {
                success: false,
                message: 'Invalid credentials'
            };
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return {
                success: false,
                message: 'Invalid credentials'
            };
        }

        // Generate session token
        const sessionToken = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store session
        await pool.execute(
            `INSERT INTO admin_sessions (admin_id, session_token, expires_at) 
             VALUES (?, ?, ?)`,
            [user.id, sessionToken, expiresAt]
        );

        return {
            success: true,
            token: sessionToken,
            admin: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name
            }
        };

    } catch (error) {
        console.error('Admin login error:', error);
        return {
            success: false,
            message: 'Login failed'
        };
    }
};

// Admin logout function
const adminLogout = async (token) => {
    try {
        await pool.execute(
            'DELETE FROM admin_sessions WHERE session_token = ?',
            [token]
        );
        return { success: true };
    } catch (error) {
        console.error('Admin logout error:', error);
        return { success: false };
    }
};

// Log admin activity
const logAdminActivity = async (adminId, action, tableName, recordId = null, details = null, req = null) => {
    try {
        const ipAddress = req?.ip || req?.connection?.remoteAddress || 'unknown';
        const userAgent = req?.headers?.['user-agent'] || 'unknown';

        await pool.execute(
            `INSERT INTO admin_activity_log 
             (admin_id, action, table_name, record_id, details, ip_address, user_agent) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [adminId, action, tableName, recordId, JSON.stringify(details), ipAddress, userAgent]
        );
    } catch (error) {
        console.error('Activity logging error:', error);
    }
};

module.exports = {
    adminAuth,
    adminLogin,
    adminLogout,
    logAdminActivity
}; 