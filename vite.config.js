import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Two pages: the editor (/) and the developer docs (/docs/)
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        docs: resolve(import.meta.dirname, 'docs/index.html'),
      },
    },
  },
});
