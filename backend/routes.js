const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const { ZipArchive } = require('archiver');
const puppeteer = require('puppeteer');
const tesseract = require('tesseract.js');
const {
  libreOfficeConvert,
  ghostscriptCompress,
  qpdfProtect,
  qpdfUnlock,
  ghostscriptPdfA,
  popplerPdfToJpg
} = require('./utils/binaries');

const router = express.Router();

// ── Setup Multer ───────────────────────────────────────────────────
const allowedMimes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png'
];
const allowedExts = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];

const upload = multer({
  storage: multer.diskStorage({
    destination: path.resolve(process.env.TEMP_DIR || process.env.UPLOAD_DIR || './tmp/uploads'),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Tipe file tidak didukung.'));
    }
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) {
      return cb(new Error('Ekstensi file tidak didukung.'));
    }
    cb(null, true);
  }
});

const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || './tmp/outputs');

const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    console.error('API Error:', err);
    if (err.code === 'ENOENT') {
      return res.status(500).json({ success: false, message: `Dependency tool tidak ditemukan. Pastikan path di file .env sudah benar. Error: ${err.message}` });
    }
    res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan internal server' });
  } finally {
    if (req.file && req.file.path) {
      fs.remove(req.file.path).catch(e => console.error("Failed to delete temp input file:", e));
    }
  }
};

// Middleware to check file signature (magic bytes)
const fileSignatureCheck = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const buffer = Buffer.alloc(4);
    const fd = await fs.open(req.file.path, 'r');
    await fs.read(fd, buffer, 0, 4, 0);
    await fs.close(fd);
    
    const hex = buffer.toString('hex').toUpperCase();
    
    // PDF magic number is %PDF (25504446)
    if (ext === '.pdf' && !hex.startsWith('25504446')) {
      await fs.remove(req.file.path);
      return res.status(400).json({ success: false, message: 'File signature tidak valid (bukan PDF asli).' });
    }
    // JPEG magic numbers (FFD8FF)
    if ((ext === '.jpg' || ext === '.jpeg') && !hex.startsWith('FFD8FF')) {
      await fs.remove(req.file.path);
      return res.status(400).json({ success: false, message: 'File signature tidak valid (bukan JPG asli).' });
    }
    // PNG magic numbers (89504E47)
    if (ext === '.png' && !hex.startsWith('89504E47')) {
      await fs.remove(req.file.path);
      return res.status(400).json({ success: false, message: 'File signature tidak valid (bukan PNG asli).' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

// Gabung upload middleware
const uploadMiddleware = [upload.single('file'), fileSignatureCheck];

// ── CONVERT ROUTES (LibreOffice) ───────────────────────────────────
router.post('/convert/pdf-to-word', uploadMiddleware, asyncHandler(async (req, res) => {
  const outFile = path.join(OUTPUT_DIR, `${uuidv4()}.docx`);
  const finalFile = await libreOfficeConvert(req.file.path, OUTPUT_DIR, 'docx:MS Word 2007 XML');
  await fs.rename(finalFile, outFile);
  const baseName = req.file.originalname.replace(/\.[^/.]+$/, "");
  res.json({ success: true, fileId: path.basename(outFile), filename: `${baseName}.docx` });
}));

router.post('/convert/pdf-to-powerpoint', uploadMiddleware, asyncHandler(async (req, res) => {
  const outFile = path.join(OUTPUT_DIR, `${uuidv4()}.pptx`);
  const finalFile = await libreOfficeConvert(req.file.path, OUTPUT_DIR, 'pptx:Impress MS PowerPoint 2007 XML');
  await fs.rename(finalFile, outFile);
  const baseName = req.file.originalname.replace(/\.[^/.]+$/, "");
  res.json({ success: true, fileId: path.basename(outFile), filename: `${baseName}.pptx` });
}));



router.post('/convert/word-to-pdf', uploadMiddleware, asyncHandler(async (req, res) => {
  const outFile = path.join(OUTPUT_DIR, `${uuidv4()}.pdf`);
  const finalFile = await libreOfficeConvert(req.file.path, OUTPUT_DIR, 'pdf');
  await fs.rename(finalFile, outFile);
  const baseName = req.file.originalname.replace(/\.[^/.]+$/, "");
  res.json({ success: true, fileId: path.basename(outFile), filename: `${baseName}.pdf` });
}));

router.post('/convert/ppt-to-pdf', uploadMiddleware, asyncHandler(async (req, res) => {
  const outFile = path.join(OUTPUT_DIR, `${uuidv4()}.pdf`);
  const finalFile = await libreOfficeConvert(req.file.path, OUTPUT_DIR, 'pdf');
  await fs.rename(finalFile, outFile);
  const baseName = req.file.originalname.replace(/\.[^/.]+$/, "");
  res.json({ success: true, fileId: path.basename(outFile), filename: `${baseName}.pdf` });
}));

router.post('/convert/excel-to-pdf', uploadMiddleware, asyncHandler(async (req, res) => {
  const outFile = path.join(OUTPUT_DIR, `${uuidv4()}.pdf`);
  const finalFile = await libreOfficeConvert(req.file.path, OUTPUT_DIR, 'pdf');
  await fs.rename(finalFile, outFile);
  const baseName = req.file.originalname.replace(/\.[^/.]+$/, "");
  res.json({ success: true, fileId: path.basename(outFile), filename: `${baseName}.pdf` });
}));

// ── OPTIMIZE & PDF/A (Ghostscript) ─────────────────────────────────
router.post('/compress', uploadMiddleware, asyncHandler(async (req, res) => {
  const level = req.body.level || 'medium';
  const outFile = path.join(OUTPUT_DIR, `${uuidv4()}.pdf`);
  await ghostscriptCompress(req.file.path, outFile, level);
  res.json({ success: true, fileId: path.basename(outFile), filename: req.file.originalname });
}));

router.post('/convert/pdf-to-pdfa', uploadMiddleware, asyncHandler(async (req, res) => {
  const outFile = path.join(OUTPUT_DIR, `${uuidv4()}.pdf`);
  await ghostscriptPdfA(req.file.path, outFile);
  res.json({ success: true, fileId: path.basename(outFile), filename: req.file.originalname });
}));

// ── SECURITY (QPDF) ────────────────────────────────────────────────
router.post('/protect', uploadMiddleware, asyncHandler(async (req, res) => {
  const { password, ownerPassword, permissions } = req.body;
  let permsArray = [];
  try { permsArray = JSON.parse(permissions); } catch(e) {}
  
  const outFile = path.join(OUTPUT_DIR, `${uuidv4()}.pdf`);
  await qpdfProtect(req.file.path, outFile, password, ownerPassword || password, permsArray);
  res.json({ success: true, fileId: path.basename(outFile), filename: req.file.originalname });
}));

router.post('/unlock', uploadMiddleware, asyncHandler(async (req, res) => {
  const { password } = req.body;
  const outFile = path.join(OUTPUT_DIR, `${uuidv4()}.pdf`);
  try {
    await qpdfUnlock(req.file.path, outFile, password);
    res.json({ success: true, fileId: path.basename(outFile), filename: req.file.originalname });
  } catch (err) {
    if (err.message && err.message.includes('invalid password')) {
      return res.status(401).json({ success: false, message: 'Password salah' });
    }
    throw err;
  }
}));

// ── MISC TOOLS (OCR, HTML to PDF, PDF to JPG) ──────────────────────
router.post('/ocr', uploadMiddleware, asyncHandler(async (req, res) => {
  // OCR processing (currently just mock/placeholder processing for basic text extraction logic)
  const outFile = path.join(OUTPUT_DIR, `${uuidv4()}-ocr.pdf`);
  // Dalam real scenario, kita gabung Tesseract output ke PDF (sekarang kita copy untuk preview jalan)
  await fs.copy(req.file.path, outFile);
  res.json({ success: true, fileId: path.basename(outFile), filename: req.file.originalname });
}));

router.post('/convert/html-to-pdf', asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) throw new Error('URL is required');
  
  const outFile = path.join(OUTPUT_DIR, `${uuidv4()}.pdf`);
  const browserArgs = { headless: 'new' };
  if (process.env.CHROMIUM_PATH) {
    browserArgs.executablePath = process.env.CHROMIUM_PATH;
  }
  const browser = await puppeteer.launch(browserArgs);
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.pdf({ path: outFile, format: 'A4', printBackground: true });
  await browser.close();
  
  res.json({ success: true, fileId: path.basename(outFile), filename: 'webpage.pdf' });
}));

router.post('/convert/pdf-to-jpg', uploadMiddleware, asyncHandler(async (req, res) => {
  const tempDir = path.join(OUTPUT_DIR, uuidv4());
  await fs.ensureDir(tempDir);
  
  const jpgFiles = await popplerPdfToJpg(req.file.path, tempDir, 85);
  
  // Zip the files
  const zipFile = path.join(OUTPUT_DIR, `${uuidv4()}.zip`);
  const output = fs.createWriteStream(zipFile);
  const archive = new ZipArchive({ zlib: { level: 9 } });
  
  archive.pipe(output);
  for (const jpg of jpgFiles) {
    archive.file(jpg, { name: path.basename(jpg) });
  }
  await archive.finalize();
  
  // Tunggu stream selesai
  await new Promise(resolve => output.on('close', resolve));
  await fs.remove(tempDir);
  
  const baseName = req.file.originalname.replace(/\.[^/.]+$/, "");
  res.json({ success: true, fileId: path.basename(zipFile), filename: `${baseName}_images.zip` });
}));

// ── IMAGE TOOLS ───────────────────────────────────────────────────
router.post('/image/remove-background', uploadMiddleware, asyncHandler(async (req, res) => {
  if (!req.file) throw new Error('File tidak ditemukan');
  
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    throw new Error('Hanya file gambar JPG/PNG yang didukung');
  }

  const { pathToFileURL, fileURLToPath } = require('url');
  
  // Gunakan dynamic import karena library ESM-only
  const { removeBackground } = await import('@imgly/background-removal-node');

  // Path absolut ke file model/assets bawaan imgly
  const distPath = path.join(__dirname, 'node_modules/@imgly/background-removal-node/dist/');
  const publicPath = pathToFileURL(distPath).href + '/';

  // Custom fetch untuk membaca file:// karena native fetch Node.js tidak mensupport file://
  const customFetch = async (url, options) => {
    if (url.startsWith('file://')) {
      const filePath = fileURLToPath(url);
      const data = await fs.readFile(filePath);
      return new Response(data);
    }
    return fetch(url, options);
  };

  // Hapus background
  const blob = await removeBackground(req.file.path, {
    publicPath: publicPath,
    fetchArgs: { fetch: customFetch }
  });
  
  // Convert Blob ke Buffer
  const buffer = Buffer.from(await blob.arrayBuffer());

  const outFile = path.join(OUTPUT_DIR, `${uuidv4()}.png`);
  await fs.writeFile(outFile, buffer);

  const baseName = req.file.originalname.replace(/\.[^/.]+$/, "");
  res.json({ success: true, fileId: path.basename(outFile), filename: `${baseName}-no-bg.png` });
}));

router.get('/download/:fileId', (req, res) => {
  const { fileId } = req.params;
  const { filename } = req.query;
  const safeFileId = path.basename(fileId); // cegah directory traversal
  const filePath = path.join(OUTPUT_DIR, safeFileId);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File tidak ditemukan atau sudah expired.');
  }
  
  res.download(filePath, filename || safeFileId, (err) => {
    if (err) console.error("Error downloading file:", err);
    // Hapus file output segera setelah di-download
    fs.remove(filePath).catch(e => console.error("Failed to delete output file:", e));
  });
});

module.exports = router;
