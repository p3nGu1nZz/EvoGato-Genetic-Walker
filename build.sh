#!/bin/bash

# Build script for EvoGato Genetic Walker Electron App
# This script builds the Vite application and packages it with Electron

set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
APP_DIR="$PROJECT_ROOT/app"
BUILD_DIR="$PROJECT_ROOT/build"

echo "========================================"
echo "EvoGato Genetic Walker - Build Script"
echo "========================================"

# Step 1: Install root project dependencies
echo ""
echo "[1/4] Installing root project dependencies..."
cd "$PROJECT_ROOT"
npm install

# Step 2: Install Electron dependencies
echo ""
echo "[2/4] Installing Electron dependencies..."
cd "$APP_DIR"
npm install

# Step 3: Build the Vite application for Electron
echo ""
echo "[3/4] Building Vite application for Electron..."
npx vite build --config vite.config.ts

# Step 4: Build Electron application
echo ""
echo "[4/4] Building Electron application..."
npm run build

echo ""
echo "========================================"
echo "Build complete!"
echo "Output: $BUILD_DIR"
echo "========================================"
