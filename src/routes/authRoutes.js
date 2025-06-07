const express = require('express');
const { register, login, logout } = require('../controllers/authController');
const { upload } = require('../middlewares/uploadMiddleware');
const { validateRegister, validateLogin } = require('../middlewares/validationMiddleware'); 
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route register dengan middleware upload untuk profile picture
router.post('/register', validateRegister, upload.single('profilePicture'), register);
router.post('/login', validateLogin, login);
router.post('/logout', authenticateToken, logout);

module.exports = router;