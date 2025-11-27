import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html
    visualizer({
      open: false, // Don't auto-open in browser
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'stripe-vendor': ['@stripe/stripe-js'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['lucide-react', 'recharts'],
          'sentry-vendor': ['@sentry/react'],
        },
      },
    },
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Chunk size warning limit
    chunkSizeWarningLimit: 600,
  },
})
