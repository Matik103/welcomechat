import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  // Validate required environment variables
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_RAPIDAPI_KEY',
    'VITE_RAPIDAPI_HOST'
  ];

  const missingVars = requiredEnvVars.filter(key => !env[key]);
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach(key => console.error(`- ${key}`));
    if (mode === 'production') {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      allowedHosts: [
        '*.lovableproject.com',
        'lovableproject.com'
      ]
    },
    plugins: [
      react(),
    ],
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
  };
});
