const { execa } = require('execa');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

// Helpers paths dari .env
const LIBREOFFICE_PATH = process.env.LIBREOFFICE_PATH || 'soffice';
const GHOSTSCRIPT_PATH = process.env.GHOSTSCRIPT_PATH || 'gs';
const QPDF_PATH = process.env.QPDF_PATH || 'qpdf';
const POPPLER_PATH = process.env.POPPLER_PATH || ''; // folder path where pdftoppm is located (or empty if in PATH)

/**
 * Konversi menggunakan LibreOffice (Word, PPT, Excel ke PDF / sebaliknya).
 */
exports.libreOfficeConvert = async (inputPath, outputDir, outFilter) => {
  const args = [
    '--headless'
  ];

  if (inputPath.toLowerCase().endsWith('.pdf')) {
    if (outFilter.includes('docx')) {
      args.push('--infilter=writer_pdf_import');
    } else if (outFilter.includes('pptx')) {
      args.push('--infilter=impress_pdf_import');
    }
    // Note: LibreOffice does not have a native calc_pdf_import for Excel
  }

  args.push('--convert-to', outFilter, '--outdir', outputDir, inputPath);

  await execa(LIBREOFFICE_PATH, args);
  // LibreOffice membuat file output di outdir dengan basename dari input
  const ext = outFilter.split(':')[0]; // e.g., 'pdf' or 'docx'
  const baseName = path.basename(inputPath, path.extname(inputPath));
  return path.join(outputDir, `${baseName}.${ext}`);
};

/**
 * Kompresi PDF menggunakan Ghostscript
 * Level: 'low' (prepress), 'medium' (ebook), 'high' (screen)
 */
exports.ghostscriptCompress = async (inputPath, outputPath, level = 'medium') => {
  const settings = {
    low: '/prepress', // High quality, low compression
    medium: '/ebook', // Medium quality, medium compression
    high: '/screen'   // Low quality, high compression
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
  await execa(GHOSTSCRIPT_PATH, args);
  return outputPath;
};

/**
 * Tambahkan proteksi password menggunakan QPDF
 */
exports.qpdfProtect = async (inputPath, outputPath, userPass, ownerPass, permissions = []) => {
  const args = [
    '--encrypt',
    userPass,
    ownerPass,
    '256',
  ];
  
  // QPDF permissions syntax
  if (permissions.includes('print')) args.push('--print=full');
  else args.push('--print=none');
  
  if (permissions.includes('edit')) args.push('--modify=all');
  else args.push('--modify=none');
  
  if (permissions.includes('copy')) args.push('--extract=y');
  else args.push('--extract=n');

  args.push('--', inputPath, outputPath);
  await execa(QPDF_PATH, args);
  return outputPath;
};

/**
 * Buka proteksi password menggunakan QPDF
 */
exports.qpdfUnlock = async (inputPath, outputPath, password) => {
  const args = [
    `--password=${password}`,
    '--decrypt',
    inputPath,
    outputPath
  ];
  await execa(QPDF_PATH, args);
  return outputPath;
};

/**
 * PDF/A Conversion menggunakan Ghostscript
 */
exports.ghostscriptPdfA = async (inputPath, outputPath) => {
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
  await execa(GHOSTSCRIPT_PATH, args);
  return outputPath;
};

/**
 * Ekstrak halaman PDF ke JPG menggunakan Poppler (pdftoppm)
 */
exports.popplerPdfToJpg = async (inputPath, outputDir, quality = 85) => {
  const binary = POPPLER_PATH ? path.join(POPPLER_PATH, 'pdftoppm') : 'pdftoppm';
  const prefix = path.join(outputDir, 'page');
  
  const args = [
    '-jpeg',
    '-jpegopt', `quality=${quality}`,
    '-r', '150', // DPI
    inputPath,
    prefix
  ];
  
  await execa(binary, args);
  // pdftoppm otomatis menambahkan -01.jpg, -02.jpg dst. Ambil file-file tersebut.
  const files = await fs.readdir(outputDir);
  return files.filter(f => f.endsWith('.jpg')).map(f => path.join(outputDir, f));
};
