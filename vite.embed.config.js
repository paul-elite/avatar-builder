import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* The no-build embed: one self-contained script (React, the editor and its styles
   bundled in) that defines <avatar-builder> and <avatar-image>. Written into the
   site build, so it's served at https://avatars.paulelite.com/embed.js */
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: { entry: 'src/embed.jsx', name: 'AvatarKit', formats: ['iife'], fileName: () => 'embed.js' },
  },
});
