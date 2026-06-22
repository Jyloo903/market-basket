const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

router.get('/login', authLimiter, authController.showLogin);
router.post('/login', authLimiter, authController.login);
router.get('/register', authLimiter, authController.showRegister);
router.post('/register', authLimiter, authController.register);
router.get('/logout', authController.logout);

module.exports = router;