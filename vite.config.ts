/// <reference types="vite/client" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ['all'] // Allow all hosts, including the lovable.dev subdomain
  },
  plugins: [
    react(),
    mode === 'development' && (() => {
      // This is a simplified replacement for the componentTagger without dependency
      return {
        name: 'lovable-dev-plugin',
        // Basic plugin functionality without external dependencies
      };
    })(),
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
