import { defineConfig } from 'vite';

export default defineConfig({
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true,
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },

  // Module resolution
  resolve: {
    alias: {
      '@': '/src',
      '@audio': '/audio',
      '@patterns': '/patterns',
      '@constellation': '/constellation',
      '@renderer': '/renderer',
      '@ui': '/ui',
    },
  },

  // Optimization
  optimizeDeps: {
    include: ['three'],
  },
});
