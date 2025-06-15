#!/bin/bash

# Set up Docker buildx
echo "Setting up Docker buildx..."
docker buildx create --name mybuilder --use || true
docker buildx inspect --bootstrap

# Build and push multi-architecture image
echo "Building and pushing multi-architecture image..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t slawekradzyminski/frontend:2.5.1 \
  --push \
  .

# Check if the build and push was successful
if [ $? -eq 0 ]; then
  echo "Multi-architecture image built and pushed successfully!"
  echo "You can verify the image with: docker buildx imagetools inspect slawekradzyminski/frontend:2.5"
else
  echo "Failed to build and push the image."
  exit 1
fi 