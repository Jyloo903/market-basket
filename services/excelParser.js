const XLSX = require('xlsx');

class ExcelParser {
  static parseTransactions(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (!rawData || rawData.length < 2) {
        throw new Error('File kosong atau hanya berisi header.');
      }

      const headers = rawData[0].map(h => h?.toString().trim().toLowerCase() || '');
      const format = this._detectFormat(headers);

      let transactions, dateMap;

      if (format === 'raw') {
        ({ transactions, dateMap } = this._parseRawFormat(rawData, headers));
      } else {
        ({ transactions, dateMap } = this._parseLegacyFormat(rawData, headers));
      }

      if (transactions.length < 2) {
        throw new Error('Data terlalu sedikit. Minimal 2 transaksi diperlukan.');
      }

      return {
        headers: rawData[0],
        transactions,
        dateMap,
        totalTransactions: transactions.length,
        detectedFormat: format
      };
    } catch (err) {
      throw new Error(`Gagal membaca file: ${err.message}`);
    }
  }

  static _detectFormat(headers) {
    const rawCols = ['no_transaksi', 'no transaksi', 'id_transaksi', 'id transaksi',
                     'transaction_id', 'transaction id', 'nota', 'invoice',
                     'nomer transaksi', 'nomor transaksi'];
    const hasIdCol = headers.some(h => rawCols.includes(h));
    const hasProdukCol = headers.some(h =>
      ['produk', 'product', 'item', 'nama_produk', 'nama produk',
       'barang', 'nama_barang', 'nama barang'].includes(h)
    );
    return (hasIdCol && hasProdukCol) ? 'raw' : 'legacy';
  }

  static _parseRawFormat(rawData, headers) {
    const idIdx = this._findColIndex(headers, ['no_transaksi','no transaksi','id_transaksi',
                                                'id transaksi','transaction_id','transaction id',
                                                'nota','invoice','nomer transaksi','nomor transaksi']);
    const produkIdx = this._findColIndex(headers, ['produk','product','item','nama_produk',
                                                    'nama produk','barang','nama_barang','nama barang']);
    const tglIdx = this._findColIndex(headers, ['tanggal','date','tgl','waktu','time']);

    if (idIdx === -1) throw new Error('Kolom ID transaksi tidak ditemukan.');
    if (produkIdx === -1) throw new Error('Kolom produk tidak ditemukan.');

    const txMap = new Map();
    const dateMap = new Map();

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const id = row[idIdx]?.toString().trim();
      const prd = row[produkIdx]?.toString().trim().toLowerCase();
      if (!id || !prd) continue;

      if (!txMap.has(id)) txMap.set(id, []);
      if (!txMap.get(id).includes(prd)) txMap.get(id).push(prd);

      if (tglIdx !== -1 && !dateMap.has(id)) {
        dateMap.set(id, row[tglIdx]?.toString().trim() || '');
      }
    }

    const transactions = [];
    const txDateMap = new Map();
    let idx = 0;
    for (const [id, items] of txMap) {
      if (items.length > 0) {
        transactions.push(items);
        txDateMap.set(idx++, dateMap.get(id) || '');
      }
    }
    return { transactions, dateMap: txDateMap };
  }

  static _parseLegacyFormat(rawData, headers) {
    // Cari kolom transaksi (bisa bernama Transaksi, Items, Produk, dll)
    let txIdx = this._findColIndex(headers, ['transaksi', 'items', 'item', 'produk', 'product', 'pembelian', 'barang']);
    if (txIdx === -1) {
      // Jika tidak ditemukan, gunakan kolom pertama
      txIdx = 0;
    }
    const tglIdx = this._findColIndex(headers, ['tanggal', 'date', 'tgl', 'waktu', 'time']);

    const transactions = [];
    const dateMap = new Map();

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const cell = row[txIdx];
      if (!cell) continue;

      // Ubah ke string, lalu pisahkan berdasarkan koma, titik koma, atau pipe
      let items = cell.toString()
        .split(/[,;|]/)               // delimiter koma, titik koma, atau pipe
        .map(s => s.trim().toLowerCase())
        .filter(s => s !== '' && s !== 'null' && s !== 'undefined');

      // Jika masih hanya satu item dan mengandung spasi? Coba split berdasarkan spasi? Tidak perlu.
      // Yang penting: jika items.length masih 1, itu berarti memang hanya satu item.
      if (items.length > 0) {
        const idx = transactions.length;
        transactions.push(items);
        if (tglIdx !== -1) {
          dateMap.set(idx, row[tglIdx]?.toString().trim() || '');
        }
      }
    }

    return { transactions, dateMap };
  }

  static _findColIndex(headers, candidates) {
    for (let i = 0; i < headers.length; i++) {
      if (candidates.some(c => headers[i].includes(c))) return i;
    }
    return -1;
  }
}

module.exports = ExcelParser;