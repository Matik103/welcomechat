
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App.tsx';
import './index.css';
import { initializeRpcFunctions } from './utils/supabaseUtils.ts';
import { AuthProvider } from './contexts/AuthContext';
import { CACHE_STALE_TIME } from './config/env.ts';

// Create a client with better caching strategy
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_STALE_TIME,
      gcTime: CACHE_STALE_TIME * 2,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchIntervalInBackground: false,
      refetchOnReconnect: 'always',
    },
  },
});

// Don't initialize RPC functions immediately to prevent blocking the app load
setTimeout(() => {
  initializeRpcFunctions().catch(err => {
    console.error('Failed to initialize RPC functions:', err);
    // Retry once after a delay
    setTimeout(() => {
      initializeRpcFunctions().catch(console.error);
    }, 5000);
  });
}, 2000);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
