/**
 * Format bytes to human-readable string
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  // BUG-06 FIX: Guard against undefined/null/NaN to prevent "NaN undefined" display
  const n = Number(bytes);
  if (!n || n <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${parseFloat((n / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Validate file size against max MB
 * @param {File} file
 * @param {number} maxMB
 * @returns {boolean}
 */
export function validateFileSize(file, maxMB = 50) {
  return file.size <= maxMB * 1024 * 1024;
}

/**
 * Trigger browser download from Blob
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get file extension
 * @param {string} filename
 * @returns {string}
 */
export function getExtension(filename) {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase();
}

/**
 * Generate output filename
 * @param {string} originalName
 * @param {string} newExt - e.g. '.pdf', '.docx'
 * @returns {string}
 */
export function makeOutputName(originalName, newExt) {
  const base = originalName.slice(0, originalName.lastIndexOf('.')) || originalName;
  return `${base}${newExt}`;
}

/**
 * Filter and validate raw files from Drag & Drop or Input events
 * @param {File[]} rawFiles
 * @param {Object} accept - e.g. {'application/pdf': ['.pdf']}
 * @param {number} maxSizeMB
 * @param {boolean} multiple
 * @returns {{accepted: File[], rejections: Object[]}}
 */
export function validateFiles(rawFiles, accept, maxSizeMB, multiple = false) {
  const maxSize = maxSizeMB * 1024 * 1024;
  let accepted = [];
  let rejections = [];

  for (let file of rawFiles) {
    const errors = [];
    
    if (accept) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      const allowedExts = Object.values(accept).flat().map(e => e.toLowerCase());
      if (!allowedExts.includes(ext) && !Object.keys(accept).includes(file.type)) {
        errors.push({ code: 'file-invalid-type' });
      }
    }

    if (file.size > maxSize) {
      errors.push({ code: 'file-too-large' });
    }

    if (errors.length > 0) {
      rejections.push({ file, errors });
    } else {
      accepted.push(file);
    }
  }

  if (!multiple && accepted.length > 1) {
    accepted = [accepted[0]];
  }

  return { accepted, rejections };
}

/** Beri id unik ke File yang belum punya. */
export function withIds(files) {
  return (files || []).map((f) => {
    if (!f.id) f.id = Math.random().toString(36).substring(2, 9);
    return f;
  });
}

/** Cek satu file cocok dengan objek accept (tanpa cek ukuran). */
export function matchesAccept(file, accept) {
  const exts = Object.values(accept || {}).flat().map((e) => String(e).toLowerCase());
  const mimes = Object.keys(accept || {}).map((m) => String(m).toLowerCase());
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  return (
    exts.length === 0 ||
    exts.includes(ext) ||
    mimes.includes((file.type || '').toLowerCase())
  );
}
