/**
 * Format bytes to human-readable string
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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
