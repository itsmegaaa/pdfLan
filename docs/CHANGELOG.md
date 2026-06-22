# [Released]

## [1.0.7] - 2026-06-22
### Added
- **Anti Layar Putih (Error Boundary):** Udah dipasang `<ErrorBoundary>` di `App.jsx`. Jadi kalau ada komponen yang error, webnya nggak bakal nge-blank putih lagi, tapi munculin pesan error yang rapi.
- **Pilih Halaman Sign PDF:** Sekarang fitur *Sign PDF* udah bisa milih mau nempel tanda tangan di halaman berapa. Nggak cuma mentok di halaman pertama doang.
- **Filter Kategori Beranda:** Milih kategori di halaman depan sekarang langsung nyambung ke URL (`/?cat=...`), jadi gampang kalau mau nge-share link kategori spesifik.

### Changed
- **Maintenance:** Buat sementara waktu, fitur `Compare PDF`, `Repair PDF`, dan `OCR PDF`.

### Fixed
- **Server Gantung Pas ZIP:** Ngebenerin *bug* di mana proses kompresi ZIP yang gagal malah bikin *server* macet (zombie request) karena *promise*-nya nggak di-handle.
- **Auto-Delete Macet:** Ngebenerin *script cron job* yang suka berhenti jalan kalau ada satu file yang nyangkut/terkunci. Sekarang operasi file-nya udah dibungkus *try-catch* satu per satu.
- **Browser Lemot/Makan RAM (Memory Leak):** 
  - Udah nerapin *LRU Cache* di `PdfPreview.jsx` biar PDF.js nggak makan RAM terus-terusan.
  - Gambar *preview* di *JpgToPdf* sekarang otomatis dibersihin dari memori (`revokeObjectURL`) kalau udah nggak dipakai.
- **Drag & Drop Error:** Ngebenerin *bug* hapus file yang suka ngaco pas lagi *drag-and-drop* di `DropZone.jsx` sama `OrganizePdf.jsx`. Sekarang udah pakai ID unik (UUID) biar stabil.
- **Sensor PDF Meleset:** Koordinat kotak hitam di fitur *Redact PDF* udah dikalibrasi ulang. Sekarang kotak sensornya bakal pas banget di posisi mouse, nggak meleset lagi gara-gara beda resolusi layar.
- **Halaman PDF to JPG Acak-acakan:** Benerin urutan halaman hasil `pdftoppm` yang berantakan karena disortir pakai abjad (10 muncul sebelum 2). Sekarang udah pakai *numeric sort* murni.
- **Server Mati Kehabisan RAM (OOM):** Ngasih batesan maksimal ukuran file 5MB khusus buat fitur *Hapus Background*, soalnya model AI-nya boros banget dan suka bikin *server Node.js* mati kalau ukuran filenya kegedean.

## [1.0.6] - 2026-06-17
### Added
- **Fitur Hapus Background:** Nambahin alat ajaib buat hapus background gambar. Prosesnya pakai AI dari `@imgly/background-removal-node` dan diproses secara aman.
- **Notifikasi Keren (Toast):** Ganti tampilan *alert error* jadul pakai library `goey-toast`. Sekarang notifikasi kalau berhasil, gagal, atau lagi loading jadi jauh lebih mulus dan interaktif.
- **Kategori Image Tools:** Bikin kategori baru "Image Tools" di menu samping dan beranda biar fiturnya gampang dicari.

### Fixed
- **Pathing AI Imgly Windows:** Benerin error `ENOENT` dan `Unsupported protocol: c:` pas Node.js nyoba muat model AI statis (`.wasm` dan `.onnx`) di Windows. Udah diakalin pakai *custom fetch* dan URL lokal biar kebaca sempurna.

## [1.0.5] - 2026-06-17
### Fixed
- **Ghostscript Windows:** Ngebenerin error CMD yang bilang `'gs' tidak dikenali`. Ternyata Windows pakainya `gswin64c`. Udah dibikin deteksi otomatis OS-nya, jadi sekarang langsung nyambung.
- **Server Bentrok & PM2 Crash:** Benerin *crash loop* di PM2 gara-gara typo pas ngimport `p-limit`. Sekalian matiin sisa-sisa proses *server* lama yang diam-diam ngerebut *request* PDF dari belakang.

## [1.0.4] - 2026-06-15
### Added
- **Panduan Install Tools:** Nambahin *guide* gampang buat install LibreOffice, Ghostscript, dkk pakai `winget` atau `choco` langsung di README.
- **Sistem Antrean (Limit):** Biar CPU nggak *hang* pas lagi banyak orang kompres PDF barengan, dibikin sistem antrean pakai `p-limit`. Maksimal 2 proses gede yang jalan berbarengan.
- **Sapu Bersih File:** File hasil editan sama aslinya sekarang bakal langsung lenyap (*auto-delete*) secepat kilat abis selesai di-download. Nggak ada file yang numpuk.

### Changed
- **Hemat RAM Server:** Output *log* dari LibreOffice/Ghostscript sengaja dimatiin (`stdio: 'ignore'`) pas *execa* jalan, biar RAM Node.js nggak kepenuhan nyimpen teks nggak penting.

## [1.0.3] - 2026-06-15
### Added
- **Jalan Diam-diam di Background:** Udah disediain *file `.bat`* khusus biar *server* bisa nyala di belakang layar pakai `pm2`. Nggak ada lagi layar *command prompt* hitam yang menuhin layar PC.
- **Mode Server Lokal (LAN):** Ditambahin *script* NPM khusus buat nyalain mode *LAN*.
- **Sekuriti Ekstensi Bodong:** Nambahin penjaga pintu masuk (*middleware*) buat ngecek beneran nggak sih filenya itu PDF/JPG/PNG? Mencegah orang nge-*bypass* upload ekstensi palsu.
- **Pesan Error Rapi:** Pasang *error handler* di backend biar kalau ada kegagalan (misalnya upload file kegedean), responsnya tetep ngasih data JSON, bukan HTML jelek.
- **Dokumentasi Panduan LAN:** Bikin contekan cara *setup* jaringan lokal.

### Fixed
- **Benerin Network Error:** Ubah setting `localhost` jadi `127.0.0.1` di *proxy* Vite buat ngehindarin masalah *ECONNREFUSED* gara-gara nge-*resolve* IPv6 di Node terbaru.
- **API URL Dinamis:** Semua URL *frontend* yang tadinya di-*hardcode* narik ke `localhost:3001` udah dirombak jadi relatif (`/api`). Jadi kalau dibuka lewat HP/PC lain via WiFi, nggak bakal meleset nyari server.
- **Handle Binari Ilang:** Kalau LibreOffice atau Ghostscript lupa di-*install*, *server* sekarang nggak bakal *crash*, tapi bakal ngasih tau pakai pesan error yang santun.
- **Drag & Drop Nge-bug:** Fitur tarik ulur urutan file di `Merge PDF` kemaren macet. Udah dibenerin dengan nyamain *ID* file ke pustaka `dnd-kit`.
- **Crash Render Halaman Banyak:** Cegah memori meledak pas buka *Edit PDF* atau *Organize PDF* buat file yang halamannya banyak. Udah pasang sistem *cache*, jadi PDF-nya cuma dimuat sekali, nggak dilooping berkali-kali.

### Changed
- **Rombak Split PDF:** Tampilan fitur potong PDF diganti total jadi *Visual Page Builder*. Sekarang kamu bisa langsung pilih/klik kotak-kotak halaman mana aja yang mau dipotong dari layar.

## [1.0.2] - 2026-06-15
### Fixed
- **Bebasin Blokir CORS:** Benerin error izin akses lintas-asal di backend. Sekarang akses dari *device* mana aja dilepas bebaskan (asal masih fase *development*).
- **File Ketinggalan di Menu:** Ngebenerin *bug* aneh di mana file yang baru aja dimasukin ke *Merge PDF* tiba-tiba ikut nongol pas kita pindah menu ke *Split PDF*. Sekarang kalau pindah menu, *file*-nya otomatis dibersihin.
- **Tampilan Daftar File Ilang:** Ngebenerin UI *ToolLayout* yang suka ngumpetin *list* file gara-gara *custom UI* tumpang tindih.
- **Loading & Sukses UI:** Ngasih animasi layar *loading* dan layar "Selesai!" ke alat-alat yang desain antarmukanya dirakit secara *custom*.
- **Konversi MS Office Gagal:** Benerin error `Write Code: 16` pas pakai LibreOffice. Sekarang konversi PDF ke format Office jalan lancar jaya.

### Changed
- **Pertahanin Nama Asli:** Nama file yang udah selesai diproses bakalan tetep pakai nama aslinya, nggak pakai nama aneh bawaan sistem lagi.
- **Rombak Tampilan Rotate PDF:** Desain ulang menu *Rotate PDF* biar lebih enak dilihat dan dipakai.
- **Edit PDF Ala Visual:** Halaman *Edit PDF* diubah gaya tampilannya jadi kayak meja kerja visual buat coret-coret/nempelin halaman.

## [1.0.0] - 2026-06-15
### Added
- **Rilis Perdana:** Akhirnya proyek **pdfLan** (sebelumnya PDFVault) lahir ke dunia! Stack-nya pakai React/Vite buat depan, Node/Express buat mesin belakangnya.
- **Fitur PDF Jalur Cepat (Client-Side):** Manipulasi PDF kayak gabung, misah, sampai putar halaman diproses 100% langsung di memori browser pakai `pdf-lib`. Jauh lebih ngebut.
- **Fitur PDF Jalur Berat (Server-Side):** Fitur yang butuh tenaga kuda kayak *Compress* atau ubah format ke Ms. Office dikerjain *server* dari belakang layar lewat *binaries* sistem.
- **Tukang Sapu Otomatis:** Bikin *cron job* yang diem-diem ngebersihin file sampah di folder `tmp/` tiap 15 menit. Nggak bakal bikin disk PC bengkak.
- **Command Santai:** Cukup satu kali pencet `npm start`, *frontend* sama *backend* langsung jalan dua-duanya berkat `concurrently`. Nggak perlu repot nyalain satu per satu.
- **Modal Dasar:** Udah disiapin *file* penting kayak `.env`, abaikan Git (`.gitignore`), sama rakitan *Tailwind* biar UI-nya cakep sejak awal.
