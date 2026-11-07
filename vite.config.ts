import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig as defineVitestConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineVitestConfig(() => ({
    plugins: [tailwindcss(), react()],
    server: {
      port: 8081,
      host: true,
      // Production is served by nginx, not Vite preview, so dev/preview can accept
      // arbitrary hosts for Docker, tunnels, CI, and shared IPv6/domain access.
      allowedHosts: true as const,
    },
    preview: {
      port: 8081,
      host: true,
      allowedHosts: true as const,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      exclude: ['node_modules/**', 'e2e/**'],
      coverage: {
        reporter: ['text', 'json', 'html'],
        // Measure every source file, not only those some test imports, so untested
        // modules show up as 0% instead of disappearing from the report.
        include: ['src/**/*.{ts,tsx}'],
        thresholds: {
          lines: 85,
          statements: 85,
          branches: 75,
          functions: 80,
        },
        exclude: [
          'node_modules/',
          'src/test/**',
          'src/**/*.test.{ts,tsx}',
          'src/**/*.d.ts',
          'src/types/generated/**',
          'src/**/*.module.css',
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
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (/node_modules\/(react|react-dom|react-router-dom)\//.test(id)) return 'react';
            if (id.includes('node_modules/@radix-ui/')) return 'ui';
            if (/node_modules\/(@hookform\/resolvers|zod|clsx|tailwind-merge|class-variance-authority)\//.test(id)) return 'utils';
            if (id.includes('node_modules/@tanstack/react-query/')) return 'query';
          }
        }
      }
    },
}))
