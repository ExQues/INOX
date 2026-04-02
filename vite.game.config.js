import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src/game',
  server: {
    port: 5174,
    open: true
  },
  build: {
    outDir: '../../dist/game',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
