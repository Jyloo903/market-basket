const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');
const Analysis = require('../models/Analysis');

router.get('/', generalLimiter, (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('index', { title: 'Market Basket Analysis' });
});

router.get('/dashboard', ensureAuth, generalLimiter, async (req, res) => {
  try {
    const analyses = await Analysis.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.render('dashboard', { 
      title: 'Dashboard',
      user: req.user,
      analyses
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.flash('error', 'Gagal memuat dashboard');
    res.redirect('/');
  }
});

module.exports = router;