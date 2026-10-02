# Manager App Architecture & Code Documentation

Dokumen ini menjelaskan struktur dan fungsi dari **Manager App** (\ManagerApp.cs\), sebuah aplikasi desktop Windows berbasis C# (WinForms/System.Windows.Forms) yang bertindak sebagai panel kontrol utama untuk menjalankan PDFVault/PDFLan secara lokal.

## 1. Fungsi Utama ManagerApp
Manager App dirancang agar user non-teknis bisa menjalankan aplikasi web PDFLan di komputer lokal tanpa perlu membuka Command Prompt, menginstal Node.js secara manual, atau menjalankan *scripts*.
- **Tugas**:
  - Menjalankan backend (Node.js) di latar belakang.
  - Melayani file Frontend statis melalui *built-in* HTTP Listener (tanpa perlu Vite dev server).
  - Bersembunyi di System Tray (Area Notifikasi Windows).
  - Mengecek ketersediaan port secara dinamis untuk menghindari *crash* port-in-use.

## 2. Analisis \ManagerApp.cs\

### A. Lifecycle & UI (WinForms)
- Aplikasi ini murni berupa sebuah \Form\ dengan ikon (Tray Icon).
- Saat dijalankan, aplikasi mengatur dirinya agar tidak terlihat di taskbar (\ShowInTaskbar = false\) dan langsung meminimalkan diri ke System Tray (\WindowState = FormWindowState.Minimized\).
- **Context Menu (Klik Kanan di Tray)**:
  - **Buka Aplikasi (Open)**: Membuka browser default (misal Chrome) dan mengarahkannya ke URL frontend lokal.
  - **Keluar (Exit)**: Menutup aplikasi. Menjalankan rutin *cleanup* untuk memastikan proses backend (Node.js) ikut terbunuh (killed) secara paksa.

### B. Node.js Backend Process Management
- **Pembuatan Proses (\ProcessStartInfo\)**: ManagerApp mengeksekusi \
ode index.js\ yang berada di dalam direktori \ackend\.
- Ia mengalihkan *Output* dan *Error* standard (RedirectStandardOutput/RedirectStandardError) agar log backend bisa dipantau atau disimpan oleh ManagerApp.
- Ia juga menyuntikkan (inject) Environment Variables seperti \PORT\ dan \NODE_ENV\ sebelum menjalankan Node.js.

### C. Static File Server (Frontend)
- Daripada bergantung pada Nginx atau \serve\ (npm), ManagerApp menggunakan \HttpListener\ bawaan .NET (C#) untuk melayani direktori \rontend/dist\.
- **MIME Types**: ManagerApp memetakan ekstensi file (seperti \.js\, \.css\, \.html\, \.png\) ke tipe MIME yang tepat, sehingga browser mengenali script JS dan CSS dari frontend React.
- **Fallback (SPA Routing)**: Jika file yang direquest tidak ditemukan (misalnya user mengakses langsung URL \http://localhost:port/tools/edit-pdf\), *HttpListener* akan mengembalikan \index.html\. Ini sangat krusial untuk aplikasi React Single Page Application (SPA).

## 3. Maintenance Tips
1. **Perubahan Port**: Port frontend dan backend dicari secara otomatis jika port *default* (misal 3000 atau 5000) sedang dipakai. Jika aplikasi tidak bisa diakses, periksa log lokal ManagerApp karena mungkin port bergeser (misal jadi 3001/5001).
2. **Kompilasi Ulang (Recompiling)**: Jika ada modifikasi pada \ManagerApp.cs\, maka perlu di-compile ulang menjadi file \.exe\ menggunakan *compiler* C# (csc.exe) bawaan .NET Framework yang ada di Windows.
3. **Zombie Process**: Jika fitur "Keluar (Exit)" gagal menutup Node.js (sering terjadi jika ditutup paksa lewat Task Manager), proses \
ode.exe\ bisa menjadi "zombie" yang mengunci port. Rutin penutupan di *Event FormClosing* sangat vital.
