@echo off
title ResolveFlow_AI - Backend Server (Port 5000)
echo ===================================================
echo Starting ResolveFlow_AI Backend Server...
echo ===================================================
cd /d "%~dp0server"
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)
call npm run dev
pause
