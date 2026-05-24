import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy target matches the SSH tunnel: ssh -q -L 3001:localhost:3001 appserver
// The App Server's Nginx listens on port 3001 inside the tunnel.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});