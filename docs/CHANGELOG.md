# Changelog

Semua perubahan yang signifikan pada proyek ini akan didokumentasikan di file ini.

Format didasarkan pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), dan proyek ini menganut [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Released]

## [1.0.6] - 2026-06-17
### Added
- **Remove Background Tool:** Menambahkan fitur hapus latar belakang gambar secara lokal (*client-side & server-side processing* aman) menggunakan model AI dari `@imgly/background-removal-node`.
- **Global Toast Notifications:** Mengganti alert error manual di frontend dengan *library* `goey-toast` yang lebih interaktif dan global untuk notifikasi sukses, gagal, dan loading.
- **Image Tools Category:** Menambahkan kategori menu baru "Image Tools" pada _sidebar_ dan _home page_.

### Fixed
- **Imgly File Pathing & Protocol Error:** Memperbaiki resolusi letak file model statis `.wasm` dan file model `.onnx` pada sistem Windows dengan mengimplementasikan _custom_ fetch (`pathToFileURL` dan pembungkusan Blob beserta mimetype) untuk menghindari error `ENOENT` dan `Unsupported protocol: c:`.

## [1.0.5] - 2026-06-17
### Fixed
- **Ghostscript Execution (Windows):** Memperbaiki *error* `'gs' tidak dikenali sebagai perintah internal atau eksternal` dengan menambahkan deteksi sistem operasi di `backend/utils/binaries.js`. Aplikasi kini secara otomatis menggunakan perintah `gswin64c` apabila dijalankan pada OS Windows.
- **Server Crash & Process Conflict:** Memperbaiki *crash loop* pada PM2 (*TypeError: pLimit is not a function*) dengan memperbarui sintaks impor modul eksternal. Mematikan proses lama (`clonepdf-server`) yang secara tidak sengaja merespons *request* kompresi dengan kode Ghostscript usang.

## [1.0.4] - 2026-06-15
### Added
- **Host Prerequisites Guide:** Menambahkan panduan instalasi Node.js, PM2, LibreOffice, Ghostscript, dll. menggunakan `winget` dan `choco` di dokumentasi README.
- **Concurrency Limit:** Mengimplementasikan antrean `p-limit` pada `backend/utils/binaries.js` untuk membatasi eksekusi *binary* eksternal maksimal 2 proses secara bersamaan, mencegah CPU server *freeze* saat diakses banyak staf sekaligus.
- **Aggressive File Cleanup:** Memodifikasi `asyncHandler` dan *route* `/download` di `backend/routes.js` untuk menghapus file PDF (input & output) seketika dalam hitungan milidetik setelah pemrosesan dan download selesai.

### Changed
- **Memory Optimization:** Menambahkan parameter `{ stdio: 'ignore' }` pada eksekusi `execa` untuk mencegah RAM Node.js penuh akibat menampung output *log* LibreOffice/Ghostscript.

## [1.0.3] - 2026-06-15
### Added
- **Background Execution:** Menambahkan *batch scripts* (`start-background.bat` dan `stop-background.bat`) yang terintegrasi dengan `pm2` untuk menjalankan server di latar belakang tanpa membiarkan terminal Windows terbuka, serta menjaganya dari *crash*.
- **LAN Mode Support:** Menambahkan skrip `start:lan` dan `dev:lan` di `package.json` untuk menjalankan aplikasi dengan *single local server PC* mode.
- **File Validation:** Menambahkan middleware pada Express untuk memvalidasi ekstensi file, tipe MIME, dan *magic bytes* secara mendalam (mencegah *bypass* ekstensi palsu pada PDF/JPG/PNG).
- **Global Error Handler:** Menambahkan *global error handler* di backend untuk memastikan *error* (seperti limit ukuran file dari Multer) dikembalikan dalam format JSON, bukan HTML.
- **Documentation:** Membuat `LOCAL_LAN_SETUP.md` dan `start-pdfvault-lan.bat` untuk mempermudah setup dan eksekusi server di lingkungan Windows.

### Fixed
- **Proxy Configuration:** Mengubah *proxy target* Vite di `vite.config.js` dari `localhost` ke `127.0.0.1` untuk menghindari *error ECONNREFUSED* (Network Error) yang disebabkan oleh resolusi IPv6 bawaan pada Node 18+.
- **Hardcoded API URLs:** Merevisi semua pemanggilan `import.meta.env.VITE_API_BASE_URL` di dalam UI *tools* (seperti `CompressPdf.jsx`, `HtmlToPdf.jsx`, dll.) dan juga mengubah nilai variabel di `frontend/.env` menjadi `/api` agar aplikasi berjalan mulus pada IP LAN mana pun tanpa dialihkan secara keliru ke `localhost:3001`.
- **Binary Dependencies Handling:** Mengubah *asyncHandler* untuk menangkap kode error `ENOENT` saat *binary tools* (LibreOffice, Ghostscript) tidak ditemukan, dan merespons dengan pesan JSON yang jelas tanpa membuat server *crash*.
- **Drag & Drop Reordering (Merge PDF):** Memperbaiki isu UI *drag-and-drop* pada `MergePdf.jsx` di mana item daftar dokumen tidak bisa ditarik/dipindahkan. Masalah dipecahkan dengan membekali setiap file *unique stable ID* dan menyelaraskan referensinya dengan pustaka `dnd-kit` pada komponen induk `ToolLayout`.
- **PdfPreview Memory & Crash Fix (Edit/Organize PDF):** Mencegah aplikasi *crash* (ditandai dengan "Gagal merender PDF" di PC klien/lain) saat mengedit PDF dengan banyak halaman. Solusi ini mencakup penambahan sistem *global document cache* di `PdfPreview.jsx` sehingga aplikasi hanya mem-*parsing* PDF sekali, tidak lagi mengulang puluhan kali secara paralel untuk merender setiap *thumbnail*.

### Changed
- **Frontend (Split PDF):** Merombak total UX menjadi *Visual Page Builder*. Pengguna kini disajikan *grid thumbnail* halaman PDF interaktif dan dapat menyeleksi secara visual halaman mana yang ingin dipisah (*two-way binding* otomatis dengan input *range* halaman).

## [1.0.2] - 2026-06-15
### Fixed
- **Backend:** Memperbaiki *error* CORS secara permanen di `index.js` dengan mengubah `app.use(cors())` agar mengizinkan semua *origin* secara mutlak selama pengembangan.
- **Frontend:** Memperbaiki bug di mana file yang diunggah di satu *tool* masih terbawa ketika pengguna berpindah ke halaman *tool* lain.
- **Frontend:** Memperbaiki bug pada `ToolLayout.jsx` di mana daftar file kustom tidak muncul/tersembunyi.
- **Frontend:** Menambahkan layar *Loading* dan *Result* pada tool yang memiliki *custom* UI.
- **Backend (LibreOffice):** Memperbaiki *error* konversi gagal (*Write Code: 16*) di fitur PDF to Word/PowerPoint/Excel.

### Changed
- **Frontend & Backend:** Menyesuaikan nama file hasil pemrosesan (download) agar menggunakan **nama file asli yang diunggah**.
- **Frontend (Rotate PDF):** Mendesain ulang total UI halaman **Rotate PDF**.
- **Frontend (Edit PDF):** Mengubah halaman `Edit PDF` menjadi **Visual Page Builder**.

## [1.0.0] - 2026-06-15
### Added
- **Initial Release:** Inisialisasi awal proyek PDFVault (Frontend Vite/React + Backend Node/Express).
- **Client-Side Tools (Phase 1):** Fitur manipulasi PDF 100% di browser via `pdf-lib`.
- **Backend Tools (Phase 2):** Implementasi konversi dan kompresi tingkat lanjut via *local system binaries*.
- **Architecture:** Cron job untuk *auto-cleanup* file di `tmp/` setiap 15 menit.
- **Workflow:** Script `concurrently` untuk menjalankan frontend dan backend via 1 command (`npm start`).
- **Setup:** File konfigurasi `.env`, `.gitignore`, dan konfigurasi UI Tailwind.
