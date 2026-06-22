const fs = require('fs').promises;

async function deleteFileIfExists(filePath) {
  if (!filePath) return;
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch (err) {
    // file tidak ada, abaikan
  }
}

async function deleteAnalysisFiles(analysis) {
  if (analysis.filePath) await deleteFileIfExists(analysis.filePath);
  if (analysis.pptPath) await deleteFileIfExists(analysis.pptPath);
}

module.exports = { deleteFileIfExists, deleteAnalysisFiles };