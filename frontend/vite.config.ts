import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy target matches the SSH tunnel that maps local 3001 to the App
// Server's Nginx on port 80:
//   ssh -q -N -L 127.0.0.1:3001:localhost:80 app-server
// Browser hits localhost:5173, Vite proxies /api to localhost:3001,
// the tunnel forwards that to Nginx on the App Server.
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