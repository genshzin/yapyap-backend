const jwt = require('jsonwebtoken');
const { config } = require('../config');

// Function untuk buat token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        config.jwtSecret,
        { expiresIn: config.jwtExpire }
    );
};

// Function untuk cek token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

module.exports = {
    generateToken,
    verifyToken
};