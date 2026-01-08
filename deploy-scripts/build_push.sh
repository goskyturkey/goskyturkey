#!/bin/bash

# Configuration
IMAGE_NAME="goskyturkey/goskyturkey"
TAG="latest"

echo "========================================"
echo "  GoSkyTurkey - Build & Push Script"
echo "========================================"

# Check if logged in
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running."
  exit 1
fi

echo "[1/3] Building Docker image for linux/amd64..."
# We use --platform linux/amd64 to ensure compatibility with most VPS envs
docker build --platform linux/amd64 -t $IMAGE_NAME:$TAG .

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "[2/3] Pushing image to Docker Hub ($IMAGE_NAME:$TAG)..."
docker push $IMAGE_NAME:$TAG

if [ $? -ne 0 ]; then
  echo "❌ Push failed! Make sure you are logged in with 'docker login'."
  exit 1
fi

echo "========================================"
echo "✅ Success! Image pushed to Docker Hub."
echo "   Image: $IMAGE_NAME:$TAG"
echo "========================================"
