const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuth, ensureAdmin } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiter');

router.use(ensureAuth, ensureAdmin, adminLimiter);

router.get('/dashboard', adminController.dashboard);
router.get('/users', adminController.listUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/', (req, res) => {
  res.redirect('/admin/dashboard');
});

module.exports = router;