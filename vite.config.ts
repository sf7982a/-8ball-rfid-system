import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve' || mode === 'development'
  const isProd = command === 'build' || mode === 'production'

  console.log(`🚀 Vite Config: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      port: 5173,
      // Development-specific server optimizations
      ...(isDev && {
        hmr: true,
        open: false, // Don't auto-open browser
        cors: true,
        strictPort: false, // Allow fallback ports
      })
    },
    build: {
      outDir: 'dist',
      // Environment-specific build settings
      ...(isDev ? {
        // DEVELOPMENT BUILD SETTINGS
        sourcemap: true,          // Enable sourcemaps for debugging
        minify: false,           // Disable minification for faster builds
        target: 'esnext',        // Use modern JS for faster compilation
        rollupOptions: {
          // Simple chunking for development
          output: {
            manualChunks: undefined // Disable complex chunking
          }
        }
      } : {
        // PRODUCTION BUILD SETTINGS
        sourcemap: false,        // Disable for security and size
        minify: 'esbuild',      // Enable minification
        target: 'es2020',       // Target broader browser support
        cssTarget: 'es2020',
        // Aggressive code splitting for production
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendor chunk - stable libraries
              vendor: [
                'react',
                'react-dom',
                'react-router-dom'
              ],
              // UI framework chunk
              ui: [
                '@radix-ui/react-dialog',
                '@radix-ui/react-dropdown-menu',
                '@radix-ui/react-select',
                '@radix-ui/react-tabs',
                '@radix-ui/react-tooltip',
                '@radix-ui/react-popover',
                '@radix-ui/react-separator',
                '@radix-ui/react-label',
                '@radix-ui/react-checkbox',
                '@radix-ui/react-switch',
                '@radix-ui/react-slider',
                '@radix-ui/react-avatar',
                '@radix-ui/react-toast',
                'lucide-react'
              ],
              // Analytics/Charts chunk
              charts: [
                'recharts',
                'date-fns'
              ],
              // Database/API chunk
              supabase: [
                '@supabase/supabase-js',
                '@supabase/auth-helpers-react',
                '@tanstack/react-query',
                'drizzle-orm'
              ],
              // Form handling chunk
              forms: [
                'react-hook-form',
                '@hookform/resolvers',
                'zod',
                'react-day-picker'
              ],
              // Utils chunk
              utils: [
                'clsx',
                'class-variance-authority',
                'tailwind-merge',
                'sonner'
              ]
            },
            // Production asset naming with cache busting
            chunkFileNames: 'js/[name]-[hash].js',
            entryFileNames: 'js/[name]-[hash].js',
            assetFileNames: (assetInfo) => {
              if (!assetInfo.name) return `assets/[name]-[hash][extname]`
              if (/\.(css)$/.test(assetInfo.name)) {
                return `css/[name]-[hash][extname]`
              }
              if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
                return `images/[name]-[hash][extname]`
              }
              if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
                return `fonts/[name]-[hash][extname]`
              }
              return `assets/[name]-[hash][extname]`
            }
          }
        },
        // Production compression settings
        reportCompressedSize: true,
        chunkSizeWarningLimit: 1000,
        // Optimize dependencies for production
        commonjsOptions: {
          include: [/node_modules/],
          transformMixedEsModules: true
        }
      })
    },
    // Environment-specific definitions
    define: {
      // Fix for dependencies that expect Node.js globals
      global: 'globalThis',
      // Environment-aware development flag
      __DEV__: isDev,
      // Add build info for debugging
      __BUILD_MODE__: JSON.stringify(isDev ? 'development' : 'production'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    },
    // Environment-specific dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        '@tanstack/react-query',
        'recharts',
        'lucide-react',
        'clsx',
        'tailwind-merge'
      ],
      // Development: include devtools, Production: exclude them
      exclude: isProd ? [
        '@tanstack/react-query-devtools'
      ] : [],
      // Development-specific optimizations
      ...(isDev && {
        force: false, // Don't force re-optimize in development
        esbuildOptions: {
          target: 'esnext', // Use modern JS for faster dev builds
        }
      })
    },
    // Base path configuration
    base: '/',
    preview: {
      port: 4173,
      host: true
    },
    // Development-specific settings
    ...(isDev && {
      clearScreen: false, // Keep console history visible
      logLevel: 'info',   // Show detailed logs in development
    }),
    // Production-specific settings
    ...(isProd && {
      logLevel: 'warn',   // Reduce noise in production builds
    })
  }
})