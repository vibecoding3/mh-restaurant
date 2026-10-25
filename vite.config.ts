import { defineConfig } from 'vite';

// Relative base so the build works from any static host path (e.g. GitHub Pages /mh-restaurant/).
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 2000 },
});
