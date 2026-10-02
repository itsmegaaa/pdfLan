# PDFLan / PDFVault Architecture Documentation

Selamat datang di direktori dokumentasi proyek PDFLan. Repositori ini terdiri dari tiga komponen utama yang bekerja sama: Frontend (React UI), Backend (Node.js API), dan Manager App (Windows Desktop Controller).

Untuk kemudahan perbaikan (maintenance) dan pengembangan fitur di masa depan, silakan baca rincian struktur dan fungsi pada masing-masing dokumen berikut:

## 1. 🎨 [Frontend Architecture](./FRONTEND_ARCHITECTURE.md)
Berisi panduan mengenai komponen React, manajemen status global menggunakan Zustand (\useToolStore\), logika UI dari \ToolLayout\ dan \DropZone\, serta pemetaan alat-alat PDF kustom (\EditPdf\, \ScanToPdf\, dsb) agar terhindar dari *rendering* ganda atau bentrok layout.

## 2. ⚙️ [Backend Architecture](./BACKEND_ARCHITECTURE.md)
Menjelaskan cara kerja server Node.js/Express, mekanisme penyimpanan file dengan Multer, *routes* utama untuk memproses konversi PDF, integrasi dengan *Command Line Utilities* eksternal (seperti Ghostscript, Poppler, LibreOffice), dan keamanan jaringan (SSRF Guard).

## 3. 🖥️ [Manager App Architecture](./MANAGER_APP_ARCHITECTURE.md)
Membahas sistem aplikasi kontroler Windows (System Tray App) berbasis C# (\ManagerApp.cs\). Dokumen ini menjelaskan bagaimana C# membungkus (menjalankan) backend Node.js dan menyediakan server HTTP (*HttpListener*) untuk file statis React, lengkap dengan *fallback routing* (SPA).

---
*Dokumentasi ini di-generate pada September 2026 sebagai /goal untuk memastikan keutuhan sistem selama maintenance.*
