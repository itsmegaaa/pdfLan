# Backend Architecture & Code Documentation

Dokumen ini menjelaskan struktur, fungsi, dan arsitektur dari folder \ackend\ PDFVault/PDFLan. 
Backend menggunakan **Node.js (Express)** dan dirancang sebagai *stateless API* yang mengandalkan *binary executables* (LibreOffice, Ghostscript, QPDF, Poppler) untuk pemrosesan file berat.

## 1. File Utama
### \index.js\
- **Fungsi**: Titik masuk utama (Entry point) untuk server Node.js.
- **Tugas**: 
  - Inisialisasi Express app.
  - Setup middleware (CORS, body-parser, Rate Limiting dengan \express-rate-limit\).
  - Menyambungkan \outes.js\ untuk fitur PDF dan \dminRoutes.js\ untuk dashboard admin.
  - Mengatur HTTPS jika dijalankan secara lokal (menggunakan certs yang di-generate).
  - Penjadwalan *Cleanup* file sementara (cron-like job menggunakan \setInterval\).

### \outes.js\
- **Fungsi**: Mengatur semua endpoint API utama yang digunakan oleh frontend.
- **Komponen Utama**:
  - **Multer Setup**: Mengatur upload file. File disimpan di disk (bukan di memori) karena binary executables (seperti Ghostscript) butuh file fisik. File disimpan dengan ekstensi aslinya agar binary tool tidak gagal (BUG-01 FIX).
  - **Endpoints**:
    - \/convert\: Konversi Office (Word/Excel/PowerPoint) ke PDF (menggunakan LibreOffice).
    - \/compress\: Mengompresi PDF (menggunakan Ghostscript).
    - \/protect\: Memberi password pada PDF (menggunakan QPDF).
    - \/unlock\: Membuka password PDF (menggunakan QPDF).
    - \/html-to-pdf\: Konversi URL web ke PDF (menggunakan Puppeteer).
    - \/pdf-a\: Konversi PDF ke format PDF/A untuk pengarsipan jangka panjang (menggunakan Ghostscript).
    - \/pdf-to-jpg\: Ekstraksi halaman PDF menjadi gambar JPG (menggunakan Poppler/pdftoppm).
    - \/download/:id\: Endpoint untuk mengunduh hasil pemrosesan.

### \dminRoutes.js\
- **Fungsi**: Mengatur endpoint untuk Dashboard Admin (misal: memantau penggunaan, *system health*, log errors).

## 2. Utilities (\utils/\)
### \inaries.js\
- **Fungsi**: *Wrapper* untuk menjalankan *Command Line Interface (CLI)* dari binary eksternal menggunakan \child_process.execFile\.
- **Eksternal Tools yang dipanggil**:
  - \soffice\ (LibreOffice) untuk konversi Word/Excel/PPT ke PDF.
  - \gswin64c.exe\ / \gs\ (Ghostscript) untuk kompresi dan konversi PDF/A.
  - \qpdf\ untuk enkripsi dan dekripsi PDF.
  - \pdftoppm\ (Poppler) untuk ekstraksi PDF ke Image.

### \ssrfGuard.js\
- **Fungsi**: Perlindungan keamanan Server-Side Request Forgery (SSRF). Terutama digunakan di endpoint \/html-to-pdf\ untuk memastikan user tidak memasukkan URL internal (seperti \localhost\, \127.0.0.1\, atau IP lokal/AWS metadata) yang bisa membahayakan server.

### \diagnostics.js\
- **Fungsi**: Mencatat log metrik pemrosesan (durasi pemrosesan, ukuran file input/output, memori yang digunakan).

## 3. Data & Penyimpanan
- \	mp/uploads\: Tempat menyimpan file sementara yang baru di-upload.
- \	mp/processed\: Tempat menyimpan hasil pemrosesan file yang siap diunduh.
- **Cleanup Mechanism**: File di dalam \	mp/\ dikosongkan secara berkala (misalnya setiap beberapa jam atau 24 jam) oleh rutin di \index.js\ agar server tidak kehabisan *storage*.

## Tips Maintenance
1. **Binary Paths**: Jika aplikasi dipindah ke *environment* lain (Linux/Mac) atau binary tidak ditemukan, periksa path di \utils/binaries.js\ (khususnya untuk Ghostscript dan Poppler). Di versi Windows, file \gswin64c.exe\ dan executables lainnya sudah disediakan dalam folder project atau system PATH.
2. **SSRF Guard**: Jika ada URL publik yang sah namun diblokir saat convert HTML ke PDF, cek \isSafeSubrequest\ di \ssrfGuard.js\.
3. **RAM Usage**: Konversi LibreOffice dan Puppeteer (\/html-to-pdf\) sangat memakan RAM. Jika server *crash* atau *Out Of Memory*, periksa parameter batas ukuran (\MAX_FILE_SIZE_MB\) di \outes.js\ atau batas konkurensi di frontend.
