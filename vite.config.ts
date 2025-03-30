import react from '@vitejs/plugin-react'
import { defineConfig as defineVitestConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineVitestConfig({
  plugins: [react()],
  server: {
    port: 8081,
    host: true,
  },
  preview: {
    port: 8081,
    host: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules/**', 'e2e/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/setup.ts',
      ],
    },
  },
  resolve: {
    alias: {
      // ... existing aliases ...
    }
  },
  define: {
    global: 'window',
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-label', '@radix-ui/react-slot', '@radix-ui/react-tabs', '@radix-ui/react-toast', '@radix-ui/themes'],
          utils: ['@hookform/resolvers', 'zod', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          query: ['@tanstack/react-query'],
        }
      }
    }
  }
})
