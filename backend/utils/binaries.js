const { execa } = require('execa');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Simple native semaphore to replace p-limit
const pLimit = (concurrency) => {
  let active = 0;
  const queue = [];
  const next = () => {
    if (queue.length > 0 && active < concurrency) {
      active++;
      const { fn, resolve, reject } = queue.shift();
      fn().then(resolve).catch(reject).finally(() => {
        active--;
        next();
      });
    }
  };
  return (fn) => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    next();
  });
};

const limit = pLimit(2);

// Helpers paths dari .env
const LIBREOFFICE_PATH = process.env.LIBREOFFICE_PATH || 'soffice';
const GHOSTSCRIPT_PATH = process.env.GHOSTSCRIPT_PATH || (os.platform() === 'win32' ? 'gswin64c' : 'gs');
const QPDF_PATH = process.env.QPDF_PATH || 'qpdf';
const POPPLER_PATH = process.env.POPPLER_PATH || ''; // folder path where pdftoppm is located (or empty if in PATH)

/**
 * Konversi menggunakan LibreOffice (Word, PPT, Excel ke PDF / sebaliknya).
 */
exports.libreOfficeConvert = (inputPath, outputDir, outFilter) => limit(async () => {
  const args = [
    '--headless'
  ];

  if (inputPath.toLowerCase().endsWith('.pdf')) {
    if (outFilter.includes('docx')) {
      args.push('--infilter=writer_pdf_import');
    } else if (outFilter.includes('pptx')) {
      args.push('--infilter=impress_pdf_import');
    }
  }

  args.push('--convert-to', outFilter, '--outdir', outputDir, inputPath);

  const ext = outFilter.split(':')[0]; // e.g., 'pdf' or 'docx'
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const expectedOutPath = path.join(outputDir, `${baseName}.${ext}`);

  try {
    await execa(LIBREOFFICE_PATH, args, { stdio: 'ignore' });
    return expectedOutPath;
  } catch (err) {
    await fs.rm(expectedOutPath, { force: true, recursive: true }).catch(() => {});
    throw err;
  }
});

/**
 * Kompresi PDF menggunakan Ghostscript
 * Level: 'low' (prepress), 'medium' (ebook), 'high' (screen)
 */
exports.ghostscriptCompress = (inputPath, outputPath, level = 'medium') => limit(async () => {
  const settings = {
    low: '/prepress',
    medium: '/ebook',
    high: '/screen'
  };
  const pdfSettings = settings[level] || '/ebook';

  const args = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dPDFSETTINGS=${pdfSettings}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOutputFile=${outputPath}`,
    inputPath
  ];
  try {
    await execa(GHOSTSCRIPT_PATH, args, { stdio: 'ignore' });
    return outputPath;
  } catch (err) {
    await fs.rm(outputPath, { force: true, recursive: true }).catch(() => {});
    throw err;
  }
});

/**
 * Tambahkan proteksi password menggunakan QPDF
 */
exports.qpdfProtect = (inputPath, outputPath, userPass, ownerPass, permissions = []) => limit(async () => {
  const args = [
    '--encrypt',
    userPass,
    ownerPass,
    '256',
  ];
  
  if (permissions.includes('print')) args.push('--print=full');
  else args.push('--print=none');
  
  if (permissions.includes('edit')) args.push('--modify=all');
  else args.push('--modify=none');
  
  if (permissions.includes('copy')) args.push('--extract=y');
  else args.push('--extract=n');

  args.push('--', inputPath, outputPath);
  try {
    await execa(QPDF_PATH, args, { stdio: 'ignore' });
    return outputPath;
  } catch (err) {
    await fs.rm(outputPath, { force: true, recursive: true }).catch(() => {});
    throw err;
  }
});

/**
 * Buka proteksi password menggunakan QPDF
 */
exports.qpdfUnlock = (inputPath, outputPath, password) => limit(async () => {
  const args = [
    `--password=${password}`,
    '--decrypt',
    inputPath,
    outputPath
  ];
  try {
    await execa(QPDF_PATH, args, { stdio: 'ignore' });
    return outputPath;
  } catch (err) {
    await fs.rm(outputPath, { force: true, recursive: true }).catch(() => {});
    throw err;
  }
});

/**
 * PDF/A Conversion menggunakan Ghostscript
 */
exports.ghostscriptPdfA = (inputPath, outputPath) => limit(async () => {
  const args = [
    '-dPDFA',
    '-dBATCH',
    '-dNOPAUSE',
    '-sProcessColorModel=DeviceRGB',
    '-sDEVICE=pdfwrite',
    '-sPDFACompatibilityPolicy=1',
    `-sOutputFile=${outputPath}`,
    inputPath
  ];
  try {
    await execa(GHOSTSCRIPT_PATH, args, { stdio: 'ignore' });
    return outputPath;
  } catch (err) {
    await fs.rm(outputPath, { force: true, recursive: true }).catch(() => {});
    throw err;
  }
});

/**
 * Ekstrak halaman PDF ke JPG menggunakan Poppler (pdftoppm)
 */
exports.popplerPdfToJpg = (inputPath, outputDir, quality = 85) => limit(async () => {
  const binaryName = os.platform() === 'win32' ? 'pdftoppm.exe' : 'pdftoppm';
  const binary = POPPLER_PATH ? path.join(POPPLER_PATH, binaryName) : binaryName;
  const prefix = path.join(outputDir, 'page');
  
  const args = [
    '-jpeg',
    '-r', '150',
    inputPath,
    prefix
  ];
  
  try {
    await execa(binary, args, { stdio: 'pipe' });
  } catch (error) {
    throw new Error(`Gagal memproses PDF dengan pdftoppm. Pastikan PDF tidak dienkripsi/password dan tidak rusak. (Details: ${error.stderr || error.message})`);
  }
  const files = await fs.readdir(outputDir);
  return files
    .filter(f => f.endsWith('.jpg'))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/[^\d]/g, ''), 10);
      const numB = parseInt(b.replace(/[^\d]/g, ''), 10);
      return numA - numB;
    })
    .map(f => path.join(outputDir, f));
});
