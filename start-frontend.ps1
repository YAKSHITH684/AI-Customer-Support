$Host.UI.RawUI.WindowTitle = "ResolveFlow_AI - Frontend Client (Port 3000)"
Write-Host "===================================================" -ForegroundColor Magenta
Write-Host "Starting ResolveFlow_AI Frontend Client..." -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Magenta

Set-Location -Path (Join-Path $PSScriptRoot "client")

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

npm run dev
