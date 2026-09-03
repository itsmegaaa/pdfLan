# Local Area Network (LAN) Setup Guide

PDFVault is designed to be hosted on a single **Host PC / Server** within your local office or home network. Client devices (computers, laptops, tablets, smartphones) do not need to install any software or binary tools—they can access all features directly through any modern web browser.

---

## 1. Host PC Preparation

1. Ensure **Node.js** (v18+) is installed on the Host PC.
2. Copy `.env.example` to `.env` inside the `backend/` directory:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Update the executable paths in `backend/.env` to match your local installation paths for binary tools (e.g. LibreOffice, Ghostscript, QPDF, etc.).
4. *(Optional)* Change `APP_PORT` if port `3000` is already in use by another application.

---

## 2. Starting the Application

You can use the automated startup scripts or run the command directly from the root directory:

### Option A: Using Startup Batch Script (Windows)
Double-click `start-pdfvault-lan.bat` in the root folder.

### Option B: Using NPM Command
Run the following in your terminal from the project root:
```bash
npm run start:lan
```

This command will:
- Build the optimized production frontend bundle.
- Launch the backend server, serving both the frontend UI and API endpoints on a single port.

---

## 3. Windows Firewall Configuration (Required for LAN Access)

To allow other devices on your local network to access the server, you must open the incoming port on the Host PC's Windows Firewall.

Open **PowerShell as Administrator** on the Host PC and run (assuming default port 3000):

```powershell
New-NetFirewallRule -DisplayName "PDFVault Local" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

---

## 4. Connecting from Client Devices

1. Open Command Prompt or PowerShell on the **Host PC**.
2. Run:
   ```bash
   ipconfig
   ```
3. Find your **IPv4 Address** (for example, `192.168.1.10`).
4. Share this address with your team members on the same network.
5. Clients can open any web browser and navigate to:
   ```
   http://192.168.1.10:3000
   ```

---

> [!WARNING]
> **Security Notice**
> PDFVault is explicitly designed for private Local Area Network (LAN) environments.
> **DO NOT** configure port forwarding or expose the application directly to the public internet without proper authentication and reverse proxy layers.
