# Script to build and pull all Docker images for the Cloud Lab platform on Windows

Write-Host "🐳 Starting Docker images build & pull pipeline..." -ForegroundColor Cyan
Write-Host "=================================================="

# 1. Pull base images for Monaco Code Runner
Write-Host "👉 [1/2] Pulling base environment images..." -ForegroundColor Yellow
$images = @(
  "python:3.11-slim",
  "node:20-slim",
  "gcc:13",
  "openjdk:17-slim",
  "ubuntu:22.04"
)

foreach ($img in $images) {
  Write-Host "⏬ Pulling $img..." -ForegroundColor Gray
  docker pull $img
}

# 2. Build local custom malware analysis image
Write-Host "👉 [2/2] Building custom malware-env:latest image..." -ForegroundColor Yellow
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptPath

if (Test-Path "Dockerfile.malware") {
  docker build -t malware-env:latest -f Dockerfile.malware .
  Write-Host "✅ Custom image malware-env:latest built successfully!" -ForegroundColor Green
} else {
  Write-Error "❌ Error: Dockerfile.malware not found in $scriptPath"
  Exit
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🎉 All Docker images are ready for Cloud Lab!" -ForegroundColor Green
