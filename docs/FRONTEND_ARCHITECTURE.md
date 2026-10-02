# Frontend Architecture & Tool Implementation Guide

Dokumen ini berisi pemetaan struktur kode frontend, khususnya untuk alat-alat (tools) PDF. Dokumentasi ini dibuat agar tidak terjadi tabrakan logika UI (seperti Drop Zone ganda atau blank screen) saat melakukan maintenance di masa depan.

## 1. Core State Management (\useToolStore\)
- **Lokasi**: \src/store/useToolStore.js\
- **Fungsi**: Menyimpan global state untuk file yang diupload (\iles\), status pemrosesan (\isProcessing\, \progress\), dan hasil akhir (\esult\, \error\).
- **Aturan Penting**: Tool biasa hanya perlu memanggil \setFiles\ dan \setResult\. \ToolLayout\ akan otomatis membaca state ini untuk menampilkan UI Loading dan Layar Hasil.

## 2. Global Layout (\ToolLayout.jsx\)
- **Lokasi**: \src/components/ToolLayout.jsx\
- **Fungsi**: Wadah utama pembungkus setiap halaman Tool. Mengatur tombol kembali, judul, dan otomatis me-render \DropZone\ standar jika tidak disembunyikan.
- **Intersepsi Layar**:
  - Jika \useToolStore.isProcessing\ bernilai \	rue\, \ToolLayout\ otomatis MENGGANTI seluruh konten \children\ menjadi layar *Loading Spinner*. (Jangan buat UI loading custom di dalam file tool kecuali tool tidak dipungkus \ToolLayout\ saat loading).
  - Jika \useToolStore.result\ ada isinya, \ToolLayout\ otomatis menampilkan layar *Sukses/Download*.
- **Props Penting**:
  - \hideDropZone\ (boolean): Jika \	rue\, Drop Zone bawaan dari \ToolLayout\ TIDAK akan di-render. Gunakan ini untuk Advanced Tools.
  - \showFileList\ (boolean): Jika \alse\, \DropZone\ standar tidak akan memunculkan daftar file di dalamnya.
  - \onProcess\: Fungsi utama ketika tombol submit ditekan.

## 3. Drop Zone Component (\DropZone.jsx\)
- **Lokasi**: \src/components/DropZone.jsx\
- **Varian**:
  - \ariant="default"\: Tampilan besar dengan padding lega. Digunakan saat workspace kosong.
  - \ariant="compact"\: Tampilan kecil (ketinggian sekitar 120px) dengan padding sempit. Digunakan untuk Advanced Tools ketika file sudah terisi dan Drop Zone hanya berfungsi sebagai tombol "Tambah File".

## 4. Pemetaan Jenis-Jenis Tools
Semua tool terletak di \src/pages/tools/\. Tools terbagi menjadi dua kategori utama berdasarkan kompleksitas UI-nya.

### A. Standard Tools
Alat-alat ini murni mengandalkan \DropZone\ bawaan dari \ToolLayout\. Tidak memerlukan modifikasi UI yang rumit.
- **Contoh**: \CompressPdf.jsx\, \UnlockPdf.jsx\, \RemoveBackground.jsx\, \WatermarkPdf.jsx\.
- **Implementasi**:
  \\\jsx
  <ToolLayout
    title="Nama Tool"
    onProcess={handleProcess}
    // Tidak menggunakan hideDropZone
  />
  \\\

### B. Advanced / Custom Tools
Alat-alat ini memiliki workspace interaktif (Drag & Drop halaman, rendering Canvas, Preview gambar). Alat ini WAJIB mematikan Drop Zone bawaan \ToolLayout\ dan menggunakan Drop Zone custom di dalam children.
- **Contoh Utama**:
  1. \EditPdf.jsx\: Menggabungkan banyak PDF dan mengatur urutan halamannya secara visual. Menggunakan \hideDropZone={true}\ dan me-render \DropZone variant="compact"\ di bawah workspace.
  2. \OrganizePdf.jsx\: Mengurutkan/menghapus halaman dari satu PDF. Menggunakan \hideDropZone={true}\.
  3. \JpgToPdf.jsx\: Upload banyak gambar dan sortable grid. Memerlukan \hideDropZone={true}\.
  4. \ScanToPdf.jsx\: Kamera/Scanner web dengan pemotongan OpenCV. Menggunakan logika internal kompleks dan \hideDropZone={true}\.
- **Implementasi Standar Advanced Tools**:
  \\\jsx
  <ToolLayout title="Nama" hideDropZone={true} showFileList={false}>
    {/* Custom Workspace Grid */}
    {pages.length > 0 && <CustomGrid />}

    {/* Custom DropZone Tambahan di bagian bawah */}
    <DropZone 
      variant={pages.length > 0 ? "compact" : "default"} 
      onFiles={customHandler} 
    />
  </ToolLayout>
  \\\

### C. Factory Tools (\_convertPages.jsx\)
- Ini bukan halaman tunggal, melainkan High Order Component (HOC) yang men-generate banyak halaman sekaligus seperti \WordToPdf\, \ExcelToPdf\, dll.
- Termasuk dalam kategori **Standard Tools** karena hanya meneruskan file ke API.

## Checklist Maintenance Masa Depan
1. **Dilarang keras menghapus \import ToolLayout\** atau \import DropZone\ saat melakukan *Find & Replace*.
2. Jika menambah tool baru yang punya UI grid/visual, **selalu lewatkan \hideDropZone={true}\** ke \ToolLayout\ agar tidak muncul Drop Zone dobel.
3. Hindari mendeklarasikan \if (isProcessing) return <Spinner/>\ secara manual di file tool jika tool tersebut sudah di-wrap \ToolLayout\. Biarkan global store dan \ToolLayout\ yang mengaturnya (agar konsisten).
4. Gunakan token warna \g-surface\, \order-border\, dan \	ext-text-main\ (lihat \DESIGN_SYSTEM.md\), hindari *hardcode* warna hex \#... \ di UI tool.

## 5. Utility Functions (\src/utils/\)
Selain UI, frontend juga memiliki modul-modul logika (*utilities*) penting:
- **\pi.js\**: Menangani semua request Axios ke backend (konversi, compress, html-to-pdf, dsb). Di file ini base URL backend diatur secara dinamis atau mengandalkan environment variable (\VITE_API_BASE_URL\).
- **\clientPdf.js\**: Manipulasi PDF murni di sisi *client* (browser) menggunakan *library* \pdf-lib\. Fungsi ini meminimalkan beban server. Meliputi penggabungan (merge), pemisahan (split), hingga menyisipkan halaman kosong.
- **\scannerMath.js\**: Kumpulan logika kompleks OpenCV (via WASM/JS) untuk fitur \ScanToPdf\. Termasuk mendeteksi tepi kertas (Edge Detection), koreksi perspektif (Warp Perspective), serta mengatur kontras/brightness gambar hasil scan.
- **\uploadServices.js\**: Pembungkus untuk mekanisme *chunked upload* jika file yang dikirim sangat besar.
- **\ileHelpers.js\**: Format penamaan, pengecekan ukuran (MB/KB), dan trigger otomatis untuk mengunduh (*download blob*) file ke perangkat user.
