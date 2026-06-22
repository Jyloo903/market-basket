const ExcelParser = require('../services/excelParser');
const miningService = require('../services/fpGrowthService');
const PptGenerator = require('../services/pptGenerator');
const Analysis = require('../models/Analysis');
const User = require('../models/User');
const { deleteFileIfExists } = require('../utils/fileCleanup');

exports.showMining = async (req, res) => {
  try {
    const analyses = await Analysis.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.render('upload', { analyses });
  } catch {
    req.flash('error', 'Terjadi kesalahan');
    res.redirect('/dashboard');
  }
};

exports.upload = async (req, res) => {
  let uploadedFilePath = null;
  try {
    if (!req.file) {
      req.flash('error', 'Silakan upload file Excel terlebih dahulu.');
      return res.redirect('/mining');
    }
    uploadedFilePath = req.file.path;

    // 1. Parse Excel
    let parseResult;
    try {
      parseResult = ExcelParser.parseTransactions(uploadedFilePath);
    } catch (err) {
      await deleteFileIfExists(uploadedFilePath);
      req.flash('error', `Format file tidak sesuai: ${err.message}`);
      return res.redirect('/mining');
    }

    if (parseResult.transactions.length < 2) {
      await deleteFileIfExists(uploadedFilePath);
      req.flash('error', 'Data terlalu sedikit. Minimal 2 transaksi diperlukan.');
      return res.redirect('/mining');
    }

    // DEBUG: Lihat struktur data
    console.log('=== DEBUG ===');
    console.log('Total transaksi:', parseResult.transactions.length);
    console.log('Contoh transaksi (3):', parseResult.transactions.slice(0, 3));
    const allItems = new Set(parseResult.transactions.flat());
    console.log('Jumlah item unik:', allItems.size);
    console.log('Sample item:', Array.from(allItems).slice(0, 10));

    // Ambil parameter
    let minSupport = parseFloat(req.body.minSupport) || 0.1;
    let minConfidence = parseFloat(req.body.minConfidence) || 0.5;
    
    // Auto lower jika data besar
    if (parseResult.transactions.length > 5000) {
      minSupport = Math.min(minSupport, 0.02);
      minConfidence = Math.min(minConfidence, 0.3);
    }

    // Jalankan FP-Growth
    let miningResult = miningService.generateRules(
      parseResult.transactions,
      minSupport,
      minConfidence
    );

    // Auto turunkan threshold sampai dapat rules (maks 4x)
    let attempts = 0;
    let currentSupport = minSupport;
    let currentConfidence = minConfidence;
    while ((!miningResult.data.rules || miningResult.data.rules.length === 0) && attempts < 5) {
      attempts++;
      currentSupport = Math.max(0.005, currentSupport * 0.6);
      currentConfidence = Math.max(0.1, currentConfidence * 0.6);
      console.log(`Attempt ${attempts}: support=${currentSupport}, confidence=${currentConfidence}`);
      miningResult = miningService.generateRules(
        parseResult.transactions,
        currentSupport,
        currentConfidence
      );
      if (miningResult.data.rules && miningResult.data.rules.length > 0) {
        req.flash('info', `Parameter otomatis diturunkan ke support ${currentSupport} dan confidence ${currentConfidence} untuk menghasilkan rules.`);
        break;
      }
    }

    if (!miningResult.data.rules || miningResult.data.rules.length === 0) {
      await deleteFileIfExists(uploadedFilePath);
      const reason = miningResult.data.errorReason || '';
      req.flash('error', `Tidak ada rules. ${reason} Data: ${parseResult.transactions.length} transaksi, item unik: ${allItems.size}. Coba data dengan lebih banyak variasi atau turunkan support/confidence manual.`);
      return res.redirect('/mining');
    }

    // Generate PPT
    const pptPath = await PptGenerator.generate(
      miningResult.data,
      req.file.originalname,
      req.user.name || 'User'
    );

    // Simpan ke database
    const analysis = await Analysis.create({
      user: req.user._id,
      fileName: req.file.originalname,
      filePath: uploadedFilePath,
      resultData: miningResult.data,
      parameters: {
        support: currentSupport,
        confidence: currentConfidence,
        totalTransactions: parseResult.transactions.length,
        totalRules: miningResult.data.totalRules,
        method: 'FP-Growth',
        detectedFormat: parseResult.detectedFormat
      },
      pptPath
    });

    await User.findByIdAndUpdate(req.user._id, { $push: { analyses: analysis._id } });

    req.flash('success', `Analisis berhasil! Ditemukan ${miningResult.data.totalRules} rules.`);
    res.redirect(`/mining/result/${analysis._id}`);

  } catch (err) {
    console.error('Mining error:', err);
    if (uploadedFilePath) await deleteFileIfExists(uploadedFilePath);
    req.flash('error', `Gagal melakukan analisis: ${err.message}`);
    res.redirect('/mining');
  }
};

exports.showResult = async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id).populate('user', 'name email');
    if (!analysis) {
      req.flash('error', 'Analisis tidak ditemukan.');
      return res.redirect('/mining');
    }
    const isOwner = analysis.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      req.flash('error', 'Anda tidak memiliki akses ke analisis ini.');
      return res.redirect('/mining');
    }
    res.render('result', {
      analysis,
      miningResult: analysis.resultData,
      parseInfo: {
        totalTransactions: analysis.parameters.totalTransactions,
        fileName: analysis.fileName,
        method: analysis.parameters.method || 'FP-Growth',
        detectedFormat: analysis.parameters.detectedFormat || 'legacy'
      }
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Terjadi kesalahan saat memuat hasil.');
    res.redirect('/mining');
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) {
      req.flash('error', 'Analisis tidak ditemukan.');
      return res.redirect('/mining');
    }
    const isOwner = analysis.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      req.flash('error', 'Tidak memiliki akses.');
      return res.redirect('/mining');
    }
    res.download(analysis.pptPath);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal download file.');
    res.redirect('/mining');
  }
};

exports.deleteAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) return res.json({ success: false, message: 'Analisis tidak ditemukan.' });
    const isOwner = analysis.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') return res.json({ success: false, message: 'Tidak memiliki akses.' });
    const { deleteAnalysisFiles } = require('../utils/fileCleanup');
    await deleteAnalysisFiles(analysis);
    await Analysis.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Analisis berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Gagal menghapus analisis.' });
  }
};

exports.uploadAndMine = exports.upload;
exports.downloadPpt = exports.downloadReport;