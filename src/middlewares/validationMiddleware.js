const validateRegister = (req, res, next) => {
    const { username, email, password } = req.body;
    const errors = [];

    // Username validation
    if (!username) errors.push('Username wajib diisi');
    else if (username.length < 3) errors.push('Username minimal 3 karakter');
    else if (username.length > 30) errors.push('Username maksimal 30 karakter');
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.push('Username hanya boleh huruf, angka, underscore');

    // Email validation
    if (!email) errors.push('Email wajib diisi');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Format email tidak valid');

    // Password validation
    if (!password) errors.push('Password wajib diisi');
    else if (password.length < 6) errors.push('Password minimal 6 karakter');
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        errors.push('Password harus mengandung huruf besar, kecil, dan angka');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validasi gagal',
            errors
        });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    // Email validation
    if (!email) errors.push('Email wajib diisi');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Format email tidak valid');

    // Password validation
    if (!password) errors.push('Password wajib diisi');
    else if (password.length < 6) errors.push('Password minimal 6 karakter');

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validasi gagal',
            errors
        });
    }

    next();
};

module.exports = {
    validateRegister,
    validateLogin
};