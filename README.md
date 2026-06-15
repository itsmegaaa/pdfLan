# ClonePDF (LAN Version)

ClonePDF is a self-hosted, offline-first PDF tool designed to be run within your Local Area Network (LAN) or on your personal machine. It provides PDF processing capabilities without needing to upload your sensitive documents to external servers.

This repository contains the LAN-specific version of ClonePDF, optimized for local execution.

## Features
- **Offline First**: Runs entirely on your local machine or network. No internet connection required after installation.
- **Privacy Focused**: Documents never leave your machine or local network.
- **Merge PDF**: Combine multiple PDFs into a single file easily.
- **Image to PDF**: Convert images (JPG, PNG, etc.) to PDF documents.
- **Extract Images**: Extract all images from a PDF file.

## Prerequisites
- **Node.js** (v18 or higher recommended)
- **NPM** or **Yarn**

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
   Double-click the `start-clonepdf-lan.bat` file in the root directory.
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
