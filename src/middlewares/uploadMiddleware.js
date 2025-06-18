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

module.exports = { upload };