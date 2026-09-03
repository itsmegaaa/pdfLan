export const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatTimeLeft = (seconds) => {
  if (seconds === Infinity || isNaN(seconds) || seconds < 0) return 'Menghitung...';
  if (seconds < 60) return `${Math.round(seconds)} dtk`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes} mnt ${remainingSeconds} dtk`;
};

// Simulasi upload berbasis Chunk untuk mendemonstrasikan Fitur 3 (Inline Retry)
// Di production, ganti setTimeout dengan axios.post()
export class ChunkedUploadService {
  constructor(file, onProgress, onStatusChange) {
    this.file = file;
    this.onProgress = onProgress;
    this.onStatusChange = onStatusChange;
    this.chunkSize = 1024 * 1024; // 1MB per chunk
    this.totalChunks = Math.ceil(file.size / this.chunkSize);
    this.currentChunk = 0;
    this.isPaused = false;
    this.startTime = null;
    this.uploadedBytes = 0;
  }

  async start() {
    this.isPaused = false;
    this.onStatusChange('uploading');
    if (!this.startTime) this.startTime = Date.now();

    try {
      while (this.currentChunk < this.totalChunks) {
        if (this.isPaused) {
          this.onStatusChange('paused', this.currentChunk);
          return;
        }

        // --- PRODUCTION AXIOS CODE (UNCOMMENT & ADJUST LATER) ---
        /*
        const start = this.currentChunk * this.chunkSize;
        const end = Math.min(start + this.chunkSize, this.file.size);
        const chunk = this.file.slice(start, end);
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('chunkIndex', this.currentChunk);
        
        await axios.post('http://localhost:8080/api/upload-chunk', formData);
        */
        
        // SIMULASI JARINGAN (0.5 detik per chunk)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Simulasi kemungkinan gagal acak 10% untuk mendemonstrasikan fitur Retry
        if (Math.random() < 0.10) {
            throw new Error("Koneksi terputus (Simulasi)");
        }

        const chunkBytes = Math.min(this.chunkSize, this.file.size - this.currentChunk * this.chunkSize);
        this.uploadedBytes += chunkBytes;
        
        this.currentChunk++;
        
        const progress = Math.min(100, Math.round((this.uploadedBytes * 100) / this.file.size));
        
        const elapsedTime = (Date.now() - this.startTime) / 1000;
        const uploadSpeed = this.uploadedBytes / elapsedTime; // bytes per sec
        const remainingBytes = this.file.size - this.uploadedBytes;
        const timeLeft = remainingBytes / uploadSpeed;

        this.onProgress(progress, timeLeft);
      }
      this.onStatusChange('success');
    } catch (error) {
      console.error(error);
      this.isPaused = true;
      this.onStatusChange('error', this.currentChunk);
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.start();
  }
}
