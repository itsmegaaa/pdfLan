@echo off
echo ========================================================
echo Memulai PDFVault Server di Background (PM2)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Memeriksa instalasi PM2...
call npm install -g pm2

echo.
echo [2/3] Mempersiapkan file frontend (Build)...
cd frontend
call npm run build
cd ..

echo.
echo [3/4] Menjalankan server di background...
call pm2 delete pdfvault-server >nul 2>&1
call pm2 start backend/index.js --name "pdfvault-server"

echo.
echo [4/4] Menyimpan konfigurasi agar otomatis jalan (opsional)...
call pm2 save

echo.
echo ========================================================
echo BERHASIL! Server sekarang berjalan di background.
echo Anda boleh menutup layar hitam ini.
echo.
echo Untuk mematikan server, jalankan file "stop-background.bat"
echo ========================================================
pause
