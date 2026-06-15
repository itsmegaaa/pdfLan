@echo off
echo ========================================================
echo Memulai PDFVault Server (Local LAN Mode)
echo ========================================================
echo.

cd /d "%~dp0"
npm run start:lan

pause
