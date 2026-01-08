#!/bin/bash

# Configuration
IMAGE_NAME="goskyturkey/goskyturkey:latest"

echo "========================================"
echo "  GoSkyTurkey - Server Update Script"
echo "========================================"

echo "[1/3] Pulling latest image from Docker Hub..."
docker compose pull

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull image. Check your internet connection or docker login status."
    exit 1
fi

echo "[2/3] Restarting containers..."
docker compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to restart containers."
    exit 1
fi

echo "[3/3] Cleaning up unused images..."
docker image prune -f

echo "========================================"
echo "✅ Server updated successfully!"
echo "========================================"
