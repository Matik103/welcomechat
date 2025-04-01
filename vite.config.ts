
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['zod', '@hookform/resolvers/zod']
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
          ui: [
            '@radix-ui/react-avatar',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            'class-variance-authority',
            'clsx',
            'tailwind-merge'
          ],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers/zod'],
          state: ['@tanstack/react-query']
        }
      }
    }
  },
  css: {
    postcss: {
      plugins: [
        require('autoprefixer'),
      ],
    },
  },
  define: {
    // This ensures environment variables are available at runtime without import.meta
    'window.ENV': {
      VITE_FIRECRAWL_API_KEY: process.env.VITE_FIRECRAWL_API_KEY || '',
      VITE_FIRECRAWL_API_URL: process.env.VITE_FIRECRAWL_API_URL || 'https://api.firecrawl.dev/v1'
    }
  }
}));
