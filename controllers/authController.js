const User = require('../models/User');
const passport = require('passport');

exports.showRegister = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('register', { title: 'Register' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, password_confirm, company } = req.body;

    if (!name || !email || !password || !password_confirm) {
      req.flash('error', 'Semua field harus diisi');
      return res.redirect('/auth/register');
    }

    if (password.length < 6) {
      req.flash('error', 'Password minimal 6 karakter');
      return res.redirect('/auth/register');
    }

    if (password !== password_confirm) {
      req.flash('error', 'Password tidak cocok');
      return res.redirect('/auth/register');
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      req.flash('error', 'Email sudah terdaftar');
      return res.redirect('/auth/register');
    }

    const user = new User({
      name,
      email,
      password,
      company: company || ''
    });
    await user.save();

    req.flash('success', 'Registrasi berhasil, silakan login');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Register error detail:', err);
    req.flash('error', `Terjadi kesalahan: ${err.message}`);
    res.redirect('/auth/register');
  }
};

exports.showLogin = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('login', { title: 'Login' });
};

exports.login = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'Logout berhasil');
    res.redirect('/auth/login');
  });
};