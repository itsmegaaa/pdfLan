import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 120000, // 2 menit untuk file besar
});

// Response interceptor untuk error handling
// IMPORTANT: re-throw the original error (not new Error) so callers can
// still read err.response.status (e.g. to detect 401 and show PIN screen)
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// ── Helpers untuk multipart/form-data ──────────────────────────────
function toFormData(file, options = {}) {
  const fd = new FormData();
  if (Array.isArray(file)) {
    file.forEach((f) => fd.append('files', f));
  } else if (file) {
    fd.append('file', file);
  }
  Object.entries(options).forEach(([key, val]) => {
    fd.append(key, typeof val === 'object' ? JSON.stringify(val) : val);
  });
  return fd;
}

// ── API calls ──────────────────────────────────────────────────────
export const apiCompress = (file, level, onUploadProgress) =>
  api.post('/compress', toFormData(file, { level }), { onUploadProgress });

export const apiConvert = (endpoint, file, onUploadProgress) =>
  api.post(`/convert/${endpoint}`, toFormData(file), { onUploadProgress });

export const apiHtmlToPdf = (url, onUploadProgress) =>
  api.post('/convert/html-to-pdf', { url }, { headers: { 'Content-Type': 'application/json' }, onUploadProgress });

export const apiPdfToJpg = (file, quality, pages, onUploadProgress) =>
  api.post('/convert/pdf-to-jpg', toFormData(file, { quality, pages }), { onUploadProgress });

export const apiProtect = (file, password, ownerPassword, permissions, onUploadProgress) =>
  api.post('/protect', toFormData(file, { password, ownerPassword, permissions }), { onUploadProgress });

export const apiUnlock = (file, password, onUploadProgress) =>
  api.post('/unlock', toFormData(file, { password }), { onUploadProgress });

export const apiRemoveBackground = (file, onUploadProgress) =>
  api.post('/image/remove-background', toFormData(file), { onUploadProgress });

export const apiDownloadUrl = (fileId) =>
  `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/download/${fileId}`;

export default api;
