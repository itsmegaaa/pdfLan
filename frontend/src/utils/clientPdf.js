import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

// ── Merge ────────────────────────────────────────────────────────────
/**
 * Merge multiple PDF Files into one
 * @param {File[]} files
 * @returns {Promise<Uint8Array>}
 */
export async function mergePdfs(files) {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return merged.save();
}

// ── Split ────────────────────────────────────────────────────────────
/**
 * Split PDF by page ranges, e.g. "1-3,5,7-9"
 * @param {File} file
 * @param {string} rangeString
 * @returns {Promise<Uint8Array[]>} - array of PDF bytes, one per range
 */
export async function splitPdfByRange(file, rangeString) {
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes);
  const totalPages = src.getPageCount();

  const ranges = parseRanges(rangeString, totalPages);
  const results = [];

  for (const range of ranges) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, range);
    pages.forEach((p) => out.addPage(p));
    results.push(await out.save());
  }
  return results;
}

/**
 * Split PDF every N pages
 * @param {File} file
 * @param {number} n
 * @returns {Promise<Uint8Array[]>}
 */
export async function splitPdfEveryN(file, n) {
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes);
  const total = src.getPageCount();
  const results = [];

  for (let i = 0; i < total; i += n) {
    const out = await PDFDocument.create();
    const indices = Array.from({ length: Math.min(n, total - i) }, (_, k) => i + k);
    const pages = await out.copyPages(src, indices);
    pages.forEach((p) => out.addPage(p));
    results.push(await out.save());
  }
  return results;
}

// ── Rotate ───────────────────────────────────────────────────────────
/**
 * Rotate pages of a PDF
 * @param {File} file
 * @param {number} angle - 90, 180, or 270
 * @param {number[]|'all'} pageIndices - 0-based indices or 'all'
 * @returns {Promise<Uint8Array>}
 */
export async function rotatePdf(file, angle, pageIndices = 'all') {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  const targets = pageIndices === 'all' ? pages : pageIndices.map((i) => pages[i]);
  targets.forEach((page) => {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  });
  return doc.save();
}

// ── Organize ─────────────────────────────────────────────────────────
/**
 * Reorder/delete pages of a PDF
 * @param {File} file
 * @param {number[]} newOrder - 0-based page indices in desired order
 * @returns {Promise<Uint8Array>}
 */
export async function organizePdf(file, newOrder) {
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, newOrder);
  copied.forEach((p) => out.addPage(p));
  return out.save();
}

// ── Watermark ────────────────────────────────────────────────────────
/**
 * Add text watermark to all pages
 * @param {File} file
 * @param {{ text, opacity, fontSize, color, rotation }} opts
 * @returns {Promise<Uint8Array>}
 */
export async function watermarkPdf(file, opts = {}) {
  const {
    text = 'WATERMARK',
    opacity = 0.3,
    fontSize = 60,
    color = '#cccccc',
    rotation = -45,
  } = opts;

  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  const [r, g, b] = hexToRgb(color);

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - (text.length * fontSize * 0.3) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(r, g, b),
      opacity,
      rotate: degrees(rotation),
    });
  });

  return doc.save();
}

// ── Page Numbers ─────────────────────────────────────────────────────
/**
 * Add page numbers to PDF
 * @param {File} file
 * @param {{ position, startAt, fontSize }} opts
 * @returns {Promise<Uint8Array>}
 */
export async function addPageNumbers(file, opts = {}) {
  const { position = 'bottom-center', startAt = 1, fontSize = 12 } = opts;
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const label = String(startAt + i);
    const textWidth = font.widthOfTextAtSize(label, fontSize);

    let x, y;
    const margin = 20;

    switch (position) {
      case 'top-left':     x = margin;                   y = height - margin - fontSize; break;
      case 'top-center':   x = (width - textWidth) / 2;  y = height - margin - fontSize; break;
      case 'top-right':    x = width - textWidth - margin; y = height - margin - fontSize; break;
      case 'bottom-left':  x = margin;                   y = margin; break;
      case 'bottom-right': x = width - textWidth - margin; y = margin; break;
      default:             x = (width - textWidth) / 2;  y = margin; break; // bottom-center
    }

    page.drawText(label, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
  });

  return doc.save();
}

// ── Redact ───────────────────────────────────────────────────────────
/**
 * Draw permanent black rectangles over areas
 * @param {File} file
 * @param {{ page: number, x: number, y: number, w: number, h: number }[]} areas - 1-based page
 * @returns {Promise<Uint8Array>}
 */
export async function redactPdf(file, areas) {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();

  areas.forEach(({ page, x, y, w, h, domW, domH }) => {
    const p = pages[page - 1];
    if (!p) return;
    const { width, height } = p.getSize();
    const scaleX = domW ? width / domW : 1;
    const scaleY = domH ? height / domH : 1;
    p.drawRectangle({
      x: x * scaleX,
      y: height - (y * scaleY) - (h * scaleY), // flip Y (PDF origin is bottom-left)
      width: w * scaleX,
      height: h * scaleY,
      color: rgb(0, 0, 0),
      opacity: 1,
    });
  });

  return doc.save();
}

// ── Crop ─────────────────────────────────────────────────────────────
/**
 * Crop PDF pages by setting MediaBox
 * @param {File} file
 * @param {{ top, right, bottom, left }} margins - pixels to cut from each side
 * @param {number[]|'all'} pageIndices
 * @returns {Promise<Uint8Array>}
 */
export async function cropPdf(file, margins, pageIndices = 'all') {
  const { top = 0, right = 0, bottom = 0, left = 0 } = margins;
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  const targets = pageIndices === 'all' ? pages : pageIndices.map((i) => pages[i]);

  targets.forEach((page) => {
    const { width, height } = page.getSize();
    page.setMediaBox(left, bottom, width - left - right, height - top - bottom);
    page.setCropBox(left, bottom, width - left - right, height - top - bottom);
  });

  return doc.save();
}

// ── Helpers ───────────────────────────────────────────────────────────
/**
 * Parse range string like "1-3,5,7-9" into 0-based index arrays
 */
function parseRanges(str, total) {
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map(Number);
        return Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i);
      }
      return [Number(part) - 1];
    })
    .filter((arr) => arr.every((i) => i >= 0 && i < total));
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0.8, 0.8, 0.8];
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
}
