const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Silakan login terlebih dahulu');
  res.redirect('/auth/login');
};

const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Anda tidak memiliki akses admin');
  res.redirect('/');
};

module.exports = { ensureAuth, ensureAdmin };