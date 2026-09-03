// 🐴 ponytail: React Context cukup, tapi mengganti di 25+ file bukan "lazy approach". Kita biarkan zustand ini.
import { create } from 'zustand';

const useToolStore = create((set) => ({
  files: [],
  isProcessing: false,
  progress: 0,
  statusMessage: '',
  statusDetail: '',
  result: null,   // { fileId, filename, url, blob }
  error: null,

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

  reset: () => set({ files: [], isProcessing: false, progress: 0, statusMessage: '', statusDetail: '', result: null, error: null }),
}));

export default useToolStore;
