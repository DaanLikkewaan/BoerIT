# dev.ps1 — start the BoerIT backend and frontend together for local development.
#
# Opens two new PowerShell windows so each process keeps its own live logs and
# can be stopped independently with Ctrl+C.
#
#   Backend  -> http://localhost:5271  (Swagger at /swagger)
#   Frontend -> http://localhost:3001
#
# Usage:  ./dev.ps1

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

Write-Host "Starting BoerIT backend  (http://localhost:5271) ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    '-NoExit', '-Command',
    "Set-Location '$root\BoerIT.Server\BoerIT.Server'; dotnet run --launch-profile http"
)

Write-Host "Starting BoerIT frontend (http://localhost:3001) ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    '-NoExit', '-Command',
    "Set-Location '$root\BoerIT.UI'; npm run dev"
)

Write-Host ""
Write-Host "Both processes launched in separate windows." -ForegroundColor Green
Write-Host "  Backend:  http://localhost:5271  (Swagger at /swagger)"
Write-Host "  Frontend: http://localhost:3001"
Write-Host "  Login:    test@boerit.local / Test1234!"
