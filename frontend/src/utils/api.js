import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 120000, // 2 menit untuk file besar
});

// Response interceptor untuk error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Terjadi kesalahan. Coba lagi.';
    return Promise.reject(new Error(message));
  }
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
export const apiCompress = (file, level) =>
  api.post('/compress', toFormData(file, { level }));

export const apiConvert = (endpoint, file) =>
  api.post(`/convert/${endpoint}`, toFormData(file));

export const apiHtmlToPdf = (url) =>
  api.post('/convert/html-to-pdf', { url }, { headers: { 'Content-Type': 'application/json' } });

export const apiPdfToJpg = (file, quality, pages) =>
  api.post('/convert/pdf-to-jpg', toFormData(file, { quality, pages }));

export const apiProtect = (file, password, ownerPassword, permissions) =>
  api.post('/protect', toFormData(file, { password, ownerPassword, permissions }));

export const apiUnlock = (file, password) =>
  api.post('/unlock', toFormData(file, { password }));

export const apiOcr = (file, lang) =>
  api.post('/ocr', toFormData(file, { lang }));

export const apiRepair = (file) =>
  api.post('/repair', toFormData(file));

export const apiCompare = (file1, file2) => {
  const fd = new FormData();
  fd.append('file1', file1);
  fd.append('file2', file2);
  return api.post('/compare', fd);
};

export const apiRemoveBackground = (file) =>
  api.post('/image/remove-background', toFormData(file));

export const apiDownloadUrl = (fileId) =>
  `${import.meta.env.VITE_API_BASE_URL || '/api'}/download/${fileId}`;

export default api;
