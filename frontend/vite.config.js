import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api (REST) and /collab (Yjs WebSocket) to the Express backend so the
// SPA and API share an origin in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:4000', changeOrigin: true },
      '/collab': { target: 'http://127.0.0.1:4000', changeOrigin: true, ws: true },
    },
  },
});
