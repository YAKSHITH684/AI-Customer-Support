@echo off
title ResolveFlow_AI - Frontend Client (Port 3000)
echo ===================================================
echo Starting ResolveFlow_AI Frontend Client...
echo ===================================================
cd /d "%~dp0client"
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)
call npm run dev
pause
