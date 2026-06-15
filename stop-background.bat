@echo off
echo ========================================================
echo Mematikan ClonePDF Server
echo ========================================================
echo.

cd /d "%~dp0"

call pm2 stop clonepdf-server

echo.
echo Server telah dimatikan.
pause
