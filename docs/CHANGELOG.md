# [Released]

## [1.0.8] - 2026-06-29
### Added
- **Scan to PDF (Smart Document Scanner):** In-browser smart scanner powered by OpenCV.js featuring:
  - Automatic paper edge and contour detection (*auto edge detection*).
  - Perspective correction and dewarping with an interactive magnifier UI for millimeter-accurate corner adjustments.
  - Document filters: Sharp Black & White (with adjustable threshold slider), Grayscale, Brightness, and Contrast controls.
  - Multi-Page Scanning & Gallery: Upload or scan multiple sheets into a queue, reorder pages, and export as a unified PDF or high-resolution JPEG ZIP package.
  - Auto-Enhance & Smart Rotation: Automatic text sharpening (unsharp masking) and portrait/landscape orientation detection.
- **PDFVault Server Manager (Desktop GUI):** Native Windows desktop manager (`ManagerApp.cs` / executable) and Electron app. Manage server services (Start, Stop, Restart), view live streaming logs, monitor CPU/RAM/Disk metrics, and check external binary health (LibreOffice, Ghostscript, QPDF, Poppler) with zero terminal interaction.
- **Complete Docker Support:** Comprehensive `Dockerfile` and `docker-compose.yml` bundling all required binary dependencies for effortless deployment across Linux, macOS, and Windows.
- **Real-Time Upload Progress Tracker:** Upload progress bars displaying uploaded megabytes (MB) and accurate percentage indicators across all tools.
- **Admin Diagnostics API:** New protected `/api/admin` endpoint for system health inspection, throughput metrics, and manual temporary storage cleanup.
- **Advanced Uploader Component:** Chunked and resumable upload architecture for handling large document uploads smoothly.

### Security
- **SSRF Guard Protection:** Strict security validation on HTML-to-PDF URL conversions. Blocks access to private IP ranges (RFC 1918/4193), localhost, and link-local addresses, with active sub-resource request interception.

### Fixed
- **Multer File Extension Handling:** Fixed storage pathing so uploaded files preserve original file extensions, preventing binary CLI execution failures.
- **File Size Formatter (NaN Glitch):** Guarded `formatFileSize` against undefined values to eliminate `NaN undefined` visual bugs.
- **Axios Response Interceptor:** Restored error response propagation so HTTP error status codes (e.g. 401 for unauthorized admin PIN) are correctly caught by the frontend.

## [1.0.7] - 2026-06-22
### Added
- **Error Boundary:** Added `<ErrorBoundary>` wrapper in `App.jsx` to prevent white-screen crashes on unexpected component errors and present clean recovery options.
- **Sign PDF Page Selector:** Users can now select any specific page to place digital signatures rather than being restricted to the first page.
- **Home Category Deep-Linking:** Homepage category filters now synchronize with URL query parameters (`/?cat=...`), making category URLs shareable.

### Changed
- **Maintenance Notice:** Temporarily suspended `Compare PDF`, `Repair PDF`, and `OCR PDF` for maintenance.

### Fixed
- **ZIP Hang on Failure:** Resolved a zombie request condition where failed ZIP compression left backend promises unhandled.
- **Auto-Cleanup Exception Handling:** Wrapped file deletion cron operations in individual `try-catch` blocks to prevent locked files from halting the cleanup daemon.
- **PDF.js Memory Leaks:** Implemented an LRU cache in `PdfPreview.jsx` to cap PDF.js canvas memory consumption, and ensured object URLs are immediately revoked in `JpgToPdf`.
- **Drag-and-Drop ID Mapping:** Fixed file removal glitch during drag-and-drop reordering in `DropZone.jsx` and `OrganizePdf.jsx` by assigning UUIDs to every item.
- **Redact PDF Coordinate Calibration:** Calibrated sensor box mouse coordinates to ensure black-out redactions match cursor positions across varying display DPI scales.
- **PDF-to-JPG Page Ordering:** Fixed lexicographical page sorting bug from `pdftoppm` output (where page 10 appeared before page 2) with pure numeric sorting.
- **Out-of-Memory Protection (Background Removal):** Imposed a 5MB upload limit on the AI background removal tool to prevent Node.js process exhaustion.

## [1.0.6] - 2026-06-17
### Added
- **AI Background Removal:** Integrated local image background removal powered by `@imgly/background-removal-node` without external cloud dependencies.
- **Modern Toast Notifications:** Replaced legacy alerts with `goey-toast` for smooth animated notifications during async tasks.
- **Image Tools Category:** Added dedicated "Image Tools" category on the navigation bar and home page.

### Fixed
- **Windows Pathing for AI Models:** Fixed `ENOENT` and `Unsupported protocol: c:` errors when loading local ONNX and WASM runtime assets on Windows.

## [1.0.5] - 2026-06-17
### Fixed
- **Ghostscript Binary Detection on Windows:** Added automatic detection for `gswin64c` on Windows environments instead of generic `gs`.
- **PM2 Port Conflict & Crash Loop:** Fixed crash loop caused by `p-limit` import syntax and terminated orphaned background processes.

## [1.0.4] - 2026-06-15
### Added
- **Prerequisites Setup Guide:** Added one-line installation guides for Chocolatey and Winget in README.
- **Concurrency Rate Limiting:** Implemented task queuing with `p-limit` (maximum 2 heavy CLI processes concurrently) to protect CPU stability.
- **Aggressive Auto-Cleanup:** Files are immediately wiped from server storage upon download completion.

### Changed
- **Server Memory Optimization:** Suppressed noisy stdout/stderr streams from LibreOffice and Ghostscript subprocesses (`stdio: 'ignore'`).

## [1.0.3] - 2026-06-15
### Added
- **Background Execution:** Added Windows `.bat` scripts for seamless background execution via PM2.
- **LAN Server Mode:** Dedicated npm scripts for host binding and LAN network operation.
- **File Extension & MIME Validation:** Added strict multer middleware to block unauthorized file uploads.
- **Structured Error Responses:** Unified JSON error payload responses across all endpoints.
- **LAN Setup Documentation:** Created comprehensive local network deployment guide.

### Fixed
- **Vite Proxy Network Resolution:** Configured proxy targets to `127.0.0.1` to prevent Node.js IPv6 `ECONNREFUSED` issues.
- **Dynamic API URLs:** Replaced hardcoded API URLs with relative paths (`/api`) for seamless multi-device LAN access.
- **Graceful Missing Binary Handling:** Graceful error reporting if LibreOffice or Ghostscript are not installed on host.
- **Multi-Page Render Cache:** Implemented caching in visual builders to prevent memory spikes on large PDF documents.

### Changed
- **Visual Page Builder:** Overhauled Split PDF into an interactive visual page grid.

## [1.0.2] - 2026-06-15
### Fixed
- **CORS Configuration:** Permissive CORS handling for local development and multi-device LAN clients.
- **State Leak Across Routes:** Cleared tool state when switching between different tools.
- **UI Layout Polishing:** Resolved component overlap issues in `ToolLayout.jsx`.
- **Office Document Conversion:** Fixed `Write Code: 16` error during LibreOffice conversions.

### Changed
- **Original Filename Preservation:** Processed files now retain their original filename on download.
- **Redesigned Rotate & Edit PDF:** Enhanced visual editing workspace and rotation controls.

## [1.0.0] - 2026-06-15
### Added
- **Initial Release:** Launched pdfLan (PDFVault) built with React/Vite frontend and Node.js/Express backend.
- **Client-Side PDF Processing:** In-memory PDF operations (merge, split, rotate, organize) via `pdf-lib`.
- **Server-Side CLI Engine:** Heavy-duty conversions and compression powered by Ghostscript, LibreOffice, and Poppler.
- **Automated Temp File Cleanup:** Periodic cleanup cron removing temporary files from `tmp/` every 15 minutes.
- **Unified Startup:** Simultaneous frontend and backend orchestration using `concurrently`.
