const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Terlalu banyak percobaan login/register. Silakan coba lagi dalam 15 menit.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.isAuthenticated(),
  keyGenerator: (req) => req.ip,
  validate: false
});

const miningLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Terlalu banyak upload analisis. Silakan coba lagi dalam 1 jam.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user ? req.user._id.toString() : req.ip,
  validate: false
});

const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Terlalu banyak download. Silakan coba lagi dalam 1 jam.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user ? req.user._id.toString() : req.ip,
  validate: false
});

const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Terlalu banyak admin operations. Silakan coba lagi dalam 1 jam.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user ? req.user._id.toString() : req.ip,
  validate: false
});

const generalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Terlalu banyak request. Silakan coba lagi dalam 1 jam.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: false
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Terlalu banyak request dari IP ini. Silakan coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1',
  validate: false
});

module.exports = {
  authLimiter,
  miningLimiter,
  downloadLimiter,
  adminLimiter,
  generalLimiter,
  globalLimiter
};