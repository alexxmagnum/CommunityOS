@echo off
echo Deteniendo servidor en puerto 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
timeout /t 2 /nobreak >nul
cd /d "%~dp0.."
echo Iniciando en modo desarrollo...
npm run dev
