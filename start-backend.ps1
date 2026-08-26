$Host.UI.RawUI.WindowTitle = "ResolveFlow_AI - Backend Server (Port 5000)"
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting ResolveFlow_AI Backend Server..." -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

Set-Location -Path (Join-Path $PSScriptRoot "server")

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}

npm run dev
