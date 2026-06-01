#!/bin/bash
# Script to build and pull all Docker images for the Cloud Lab platform

echo "🐳 Starting Docker images build & pull pipeline..."
echo "=================================================="

# 1. Pull base images for Monaco Code Runner
echo "👉 [1/2] Pulling base environment images..."
images=(
  "python:3.11-slim"
  "node:20-slim"
  "gcc:13"
  "openjdk:17-slim"
  "ubuntu:22.04"
)

for img in "${images[@]}"; do
  echo "⏬ Pulling $img..."
  docker pull "$img"
done

# 2. Build local custom malware analysis image
echo "👉 [2/2] Building custom malware-env:latest image..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f "Dockerfile.malware" ]; then
  docker build -t malware-env:latest -f Dockerfile.malware .
  echo "✅ Custom image malware-env:latest built successfully!"
else
  echo "❌ Error: Dockerfile.malware not found in $SCRIPT_DIR"
  exit 1
fi

echo "=================================================="
echo "🎉 All Docker images are ready for Cloud Lab!"
