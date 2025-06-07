const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    try {
        // Ambil token dari header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token diperlukan'
            });
        }

        // Verify token
        const decoded = verifyToken(token);
        
        // Cari user berdasarkan ID dari token
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid'
            });
        }

        // Set user ke req agar bisa diakses di controller
        req.user = user;
        next(); // Lanjut ke controller

    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Token tidak valid atau expired'
        });
    }
};

module.exports = { authenticateToken };