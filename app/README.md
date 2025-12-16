# EvoGato Genetic Walker - Electron App

This directory contains the Electron wrapper for running the EvoGato Genetic Walker simulation as a standalone desktop application.

## Prerequisites

- Node.js 18+ 
- npm

## Building the Application

From the project root, run:

```bash
./build.sh
```

This script will:
1. Install project dependencies
2. Install Electron dependencies
3. Build the Vite application
4. Package the Electron application

The output will be in the `/build` directory.

## Development

To run the app locally for development:

```bash
# From project root
npm install

# From app directory
cd app
npm install
npx vite build --config vite.config.ts
npm start
```

## Files

- `main.js` - Electron main process
- `preload.js` - Secure context bridge for IPC
- `index.html` - Entry point HTML (bundled by Vite)
- `vite.config.ts` - Vite configuration for building the web assets
- `package.json` - Electron dependencies and build configuration
