import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for Electron build
// Bundles all dependencies for offline use
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '..', '');
    const appDir = __dirname;
    const projectRoot = path.resolve(__dirname, '..');
    return {
      root: appDir,
      base: './',
      build: {
        outDir: 'dist',
        emptyOutDir: true,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': projectRoot,
        }
      }
    };
});
