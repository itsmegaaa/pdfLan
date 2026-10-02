// 🐴 ponytail: React Context cukup, tapi mengganti di 25+ file bukan "lazy approach". Kita biarkan zustand ini.
import { create } from 'zustand';

const useToolStore = create((set, get) => ({
  files: [],
  isProcessing: false,
  progress: 0,
  statusMessage: '',
  statusDetail: '',
  result: null,   // { fileId, filename, url, blob }
  error: null,

  // File titipan dari smart drop di Home — diambil tool tujuan sekali pakai
  pendingFiles: [],
  setPendingFiles: (files) => set({ pendingFiles: files }),
  consumePendingFiles: () => {
    const files = get().pendingFiles;
    if (files.length) set({ pendingFiles: [] });
    return files;
  },

  setFiles: (files) => set({ files, error: null, result: null }),
  addFiles: (newFiles) => set((state) => ({ files: [...state.files, ...newFiles] })),
  removeFile: (id) => set((state) => ({ files: state.files.filter((f, i) => (f.id ? f.id !== id : i !== id)) })),
  reorderFiles: (files) => set({ files }),

  startProcess: (statusMessage = 'Sedang memproses…', statusDetail = '') =>
    set({ isProcessing: true, progress: 0, statusMessage, statusDetail, error: null, result: null }),
  setProgress: (progress) => set({ progress }),
  setStatus: (statusMessage, statusDetail = '') => set({ statusMessage, statusDetail }),
  setUploadProgress: (percent, detail = '') => set({
    progress: Math.min(100, Math.max(0, percent)),
    statusMessage: percent < 100 ? `Mengunggah file (${Math.round(percent)}%)...` : 'Memproses di server...',
    statusDetail: detail
  }),
  setResult: (result) => set({ isProcessing: false, progress: 100, statusMessage: 'Selesai!', result }),
  setError: (error) => set({ isProcessing: false, error }),
  cancelProcess: () => set({ isProcessing: false, progress: 0, statusMessage: '', statusDetail: '' }),

  // ── Batch queue ──────────────────────────────────────────────
  // batch: { isRunning, items: [{ id, file, status, progress, resultUrl, blob, filename, error }] }
  batch: null,
  startBatch: (files) => set({
    batch: {
      isRunning: true,
      items: files.map((f) => ({
        id: f.id || Math.random().toString(36).substring(2, 9),
        file: f,
        status: 'queued',
        progress: 0,
      })),
    },
  }),
  updateBatchItem: (id, patch) => set((s) => ({
    batch: s.batch && {
      ...s.batch,
      items: s.batch.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    },
  })),
  finishBatch: () => set((s) => ({ batch: s.batch && { ...s.batch, isRunning: false } })),
  cancelBatch: () => set((s) => ({ batch: s.batch && { ...s.batch, isRunning: false } })),
  clearBatch: () => set({ batch: null }),

  reset: () => set({ files: [], isProcessing: false, progress: 0, statusMessage: '', statusDetail: '', result: null, error: null, batch: null, pendingFiles: [] }),
}));

export default useToolStore;
