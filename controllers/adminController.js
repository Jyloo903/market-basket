const User = require('../models/User');
const Analysis = require('../models/Analysis');
const { deleteAnalysisFiles } = require('../utils/fileCleanup');

exports.dashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAnalysis = await Analysis.countDocuments();
    const recentAnalyses = await Analysis.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      totalUsers,
      totalAnalysis,
      recentAnalyses
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    req.flash('error', 'Terjadi kesalahan');
    res.redirect('/');
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render('admin/users', { 
      title: 'Manage Users',
      users,
      currentUser: req.user
    });
  } catch (err) {
    console.error('List users error:', err);
    req.flash('error', 'Terjadi kesalahan');
    res.redirect('/admin/dashboard');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.json({ success: false, message: 'User tidak ditemukan' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.json({ success: false, message: 'Tidak bisa menghapus akun sendiri' });
    }

    const analyses = await Analysis.find({ user: req.params.id });
    await Promise.all(analyses.map(analysis => deleteAnalysisFiles(analysis)));
    await Analysis.deleteMany({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: `User ${user.name} berhasil dihapus` });
  } catch (err) {
    console.error('Delete user error:', err);
    res.json({ success: false, message: 'Terjadi kesalahan' });
  }
};