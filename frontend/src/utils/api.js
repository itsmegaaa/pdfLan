const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = { status, data: response }; // Mock axios response object for compat
  }
}

const api = {
  post: async (endpoint, body, options = {}) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}${endpoint}`);
      
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, val]) => {
          xhr.setRequestHeader(key, val);
        });
      }

      if (options.onUploadProgress) {
        xhr.upload.onprogress = options.onUploadProgress;
      }

      xhr.onload = () => {
        let data;
        try { data = JSON.parse(xhr.response); } catch (e) { data = xhr.response; }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ data, status: xhr.status });
        } else {
          reject(new ApiError(data?.message || 'Request failed', xhr.status, data));
        }
      };

      xhr.onerror = () => reject(new ApiError('Network error', 0, null));
      xhr.timeout = 120000;
      xhr.ontimeout = () => reject(new ApiError('Request timeout', 408, null));
      
      xhr.send(body instanceof FormData ? body : JSON.stringify(body));
    });
  }
};

// --- Helpers untuk multipart/form-data ---
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

// --- API calls ---
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
  `${BASE_URL}/download/${fileId}`;

export default api;
