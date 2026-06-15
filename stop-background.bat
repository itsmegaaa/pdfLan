@echo off
echo ========================================================
echo Mematikan PDFVault Server
echo ========================================================
echo.

cd /d "%~dp0"

call pm2 stop pdfvault-server

echo.
echo Server telah dimatikan.
pause
