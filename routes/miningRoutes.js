const express = require('express');
const router = express.Router();
const miningController = require('../controllers/miningController');
const { ensureAuth } = require('../middleware/auth');
const { miningLimiter, downloadLimiter } = require('../middleware/rateLimiter');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { deleteFileIfExists } = require('../utils/fileCleanup');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'))
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /xlsx|xls|csv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (extname) return cb(null, true);
  cb(new Error('Hanya file Excel (.xlsx, .xls, .csv) yang diizinkan'));
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/', ensureAuth, miningController.showMining);

router.post('/upload', 
  ensureAuth, 
  miningLimiter, 
  upload.single('excelFile'), 
  async (req, res, next) => {
    if (!req.file) {
      req.flash('error', 'Silakan pilih file Excel terlebih dahulu');
      return res.redirect('/mining');
    }
    next();
  }, 
  miningController.upload
);

router.get('/result/:id', ensureAuth, miningController.showResult);
router.get('/download-report/:id', ensureAuth, downloadLimiter, miningController.downloadReport);
router.delete('/delete/:id', ensureAuth, miningController.deleteAnalysis);

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    req.flash('error', `Error upload: ${error.message}`);
  } else if (error) {
    req.flash('error', error.message);
  }
  if (req.file && req.file.path) {
    deleteFileIfExists(req.file.path).catch(console.error);
  }
  res.redirect('/mining');
});

module.exports = router;