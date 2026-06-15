import { create } from 'zustand';

const useToolStore = create((set) => ({
  files: [],
  isProcessing: false,
  progress: 0,
  result: null,   // { fileId, filename, url, blob }
  error: null,

  setFiles: (files) => set({ files, error: null, result: null }),
  addFiles: (newFiles) => set((state) => ({ files: [...state.files, ...newFiles] })),
  removeFile: (index) => set((state) => ({ files: state.files.filter((_, i) => i !== index) })),
  reorderFiles: (files) => set({ files }),

  startProcess: () => set({ isProcessing: true, progress: 0, error: null, result: null }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ isProcessing: false, progress: 100, result }),
  setError: (error) => set({ isProcessing: false, error }),

  reset: () => set({ files: [], isProcessing: false, progress: 0, result: null, error: null }),
}));

export default useToolStore;
