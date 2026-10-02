@echo off
title Ventas OS
cd /d "%~dp0"
echo Iniciando Ventas OS...
netstat -ano | findstr /R /C:":4321[^0-9]*LISTENING" >nul
if %errorlevel%==0 (
  echo El servidor ya estaba activo, no se abre uno nuevo.
) else (
  start "Ventas OS - servidor (no cerrar)" /min cmd /c python serve.py
  timeout /t 2 /nobreak >nul
)
start "" "http://localhost:4321"
exit
