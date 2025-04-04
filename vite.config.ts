
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Only use the componentTagger in development mode
    // And make it conditional to avoid issues in production build
    mode === 'development' && process.env.USE_TAGGER === 'true' ? 
      // @ts-ignore - Import it dynamically only when needed
      import('lovable-tagger').then(module => module.componentTagger()) : null,
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
  }
}));
