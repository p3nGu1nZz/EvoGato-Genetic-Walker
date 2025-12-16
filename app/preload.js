// Preload script for secure context bridge
// This file runs in a privileged context and can expose
// specific Node.js APIs to the renderer process safely

const { contextBridge } = require('electron');

// Expose any APIs needed by the application
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
