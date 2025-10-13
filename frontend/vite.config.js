// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
    extensions: ['.js', '.jsx', '.json'],
  },
  server: {
    port: 5173,
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
  },
  envPrefix: 'VITE_',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
});
