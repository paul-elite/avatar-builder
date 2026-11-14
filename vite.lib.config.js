import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* Library build: bundles src/lib into ESM + CJS with React externalized, so
   the host app provides its own React. Output goes to dist-lib (the site build
   keeps the default dist, which Vercel serves). */

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-lib',
    emptyOutDir: true,
    lib: {
      entry: 'src/lib/index.js',
      formats: ['es', 'cjs'],
      fileName: (format) => `avatar-builder.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
});
