const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { protect, owner } = require('../middleware/authMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const baseName = path.basename(file.originalname || 'image', ext).replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${baseName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  return cb(new Error('Only image files are allowed'));
};

const upload = multer({ storage, fileFilter });

router.post('/', protect, owner, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Image file is required' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.status(201).json({ fileUrl });
});

module.exports = router;
