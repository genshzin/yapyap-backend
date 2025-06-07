const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Cek apakah user sudah ada
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email atau username sudah terdaftar'
            });
        }

        // Buat user baru
        const newUser = new User({
            username,
            email,
            password
        });

        // Jika ada file profile picture
        if (req.file) {
            newUser.profilePicture = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'User berhasil didaftarkan',
            user: newUser
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Cek apakah user ada
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Email atau password salah'
            });
        }

        // Cek password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Email atau password salah'
            });
        }
        
        user.isOnline = true;
        user.lastSeen = new Date();
        await user.save();

        const token = generateToken(user._id);

        // Login sukses
        res.status(200).json({
            success: true,
            message: 'Login berhasil',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                isOnline: user.isOnline,
                lastSeen: user.lastSeen
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
}
const logout = async (req, res) => {
    try {
        // Set user offline
        req.user.isOnline = false;
        req.user.lastSeen = new Date();
        await req.user.save();

        res.json({
            success: true,
            message: 'Logout berhasil'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
}

module.exports = {
    register,
    login,
    logout
};