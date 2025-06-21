const multer = require('multer');

// Setup multer untuk upload gambar
const storage = multer.memoryStorage(); // Simpan di memory sebagai Buffer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Max 5MB
    },
    fileFilter: (req, file, cb) => {
        // Hanya terima file gambar
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('File harus berupa gambar!'), false);
        }
    }
});

// Middleware wrapper untuk handle optional file upload
const optionalUpload = (req, res, next) => {
    // Cek apakah request menggunakan multipart/form-data
    const contentType = req.headers['content-type'];
    
    if (contentType && contentType.includes('multipart/form-data')) {
        // Jika multipart, gunakan multer dengan error handling
        upload.single('profilePicture')(req, res, (err) => {
            if (err) {
                // Jika ada error dari multer tapi bukan karena missing file
                if (err.code !== 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }
            }
            next();
        });
    } else {
        // Jika bukan multipart (raw JSON), skip multer
        next();
    }
};

module.exports = { upload, optionalUpload };