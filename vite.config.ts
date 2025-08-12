import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost/mi-proyecto-backend',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'http://localhost:5173');
          });
          proxy.on('error', (err) => {
            console.error('Proxy error:', err);
          });
        }
      },
      '/uploads': {
        target: 'http://localhost/mi-proyecto-backend/uploads',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uploads/, ''),
        secure: false
      },
      '/thumbnails': {
        target: 'http://localhost/mi-proyecto-backend/thumbnails',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/thumbnails/, ''),
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  }
});