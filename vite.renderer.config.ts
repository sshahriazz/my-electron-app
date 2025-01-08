import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: process.env.IS_DEV !== 'true' ? './' : '/',
  build: {
    outDir: '.vite/renderer',
    emptyOutDir: true,
    target: 'esnext',
    minify: process.env.IS_DEV !== 'true',
    sourcemap: process.env.IS_DEV === 'true',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
