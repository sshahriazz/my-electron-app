import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '.vite/build',
    emptyOutDir: true,
    target: 'node18',
    sourcemap: 'inline',
    rollupOptions: {
      external: [
        'electron',
        'keyboard-tracker',
        'keyboard-tracker-darwin-arm64'
      ],
    },
  },
});
