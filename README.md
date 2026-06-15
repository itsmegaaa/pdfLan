# PDFVault

PDFVault is a self-hosted, offline-first PDF tool designed to be run within your Local Area Network (LAN) or on your personal machine. It provides PDF processing capabilities without needing to upload your sensitive documents to external servers.

This repository contains the LAN-specific version of PDFVault, optimized for local execution.

## Features
- **Offline First**: Runs entirely on your local machine or network. No internet connection required after installation.
- **Privacy Focused**: Documents never leave your machine or local network.
- **Merge PDF**: Combine multiple PDFs into a single file easily.
- **Image to PDF**: Convert images (JPG, PNG, etc.) to PDF documents.
- **Extract Images**: Extract all images from a PDF file.

## Prerequisites for Host PC
To run this application as a server on your local network, the Host PC requires the following to be installed.

**💡 Easiest Way (Using Chocolatey - Recommended):**
If you have [Chocolatey](https://chocolatey.org/) installed, open PowerShell as Administrator and run this one-liner to install everything you need:
```powershell
choco install nodejs pm2 libreoffice ghostscript qpdf poppler tesseract chromium -y
```

**Alternative Way (Using Winget - Windows 10/11 built-in):**
Open PowerShell and run:
```powershell
winget install OpenJS.NodeJS -e
winget install TheDocumentFoundation.LibreOffice -e
winget install ArtifexSoftware.GhostScript -e
```

1. **Node.js (v18 or higher)**
   - Installed via script above, or manually from [nodejs.org](https://nodejs.org/).

2. **PM2** (Process Manager)
   - Required if you want to use the background `.bat` scripts.
   - After installing Node.js, open Terminal/Command Prompt and run:
     ```bash
     npm install -g pm2
     ```

3. **LibreOffice**
   - Required for converting Office files (Word/Excel/PowerPoint) to PDF.
   - *Note down the installation path (usually `C:\Program Files\LibreOffice\program\soffice.exe`) for your `.env` file.*

4. **Ghostscript**
   - Required for PDF compression and advanced PDF manipulation.
   - *Note down the executable path (usually `C:\Program Files\gs\gs[version]\bin\gswin64c.exe`) for your `.env` file.*

> Note: Client PCs accessing the app via browser do not need to install anything.

## Detailed LAN Setup
For a complete guide on how to configure the Host PC, setup `.env` variables, and configure the Windows Firewall so other computers can access it, please read:
👉 **[Local LAN Setup Guide](docs/LOCAL_LAN_SETUP.md)**

## Quick Start (Windows)

The easiest way to run the application on Windows is to use the provided batch scripts:

1. **Install Dependencies** (First time only):
   Open a terminal in the root directory and install dependencies for both the frontend and backend.
   ```bash
   cd frontend
   npm install
   cd ../backend
   npm install
   cd ..
   ```

2. **Start the Application**:
   Double-click the `start-pdfvault-lan.bat` file in the root directory.
   This will automatically start both the backend server and frontend development server in the background.

3. **Access the App**:
   Once started, open your browser and navigate to:
   `http://localhost:5173` (or the port specified by Vite/React).

4. **Stop the Application**:
   To stop the running services, double-click the `stop-background.bat` file.

## Manual Setup

If you are not on Windows or prefer to run things manually:

1. **Start Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
