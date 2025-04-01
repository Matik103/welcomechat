
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App.tsx';
import './index.css';
import { initializeRpcFunctions } from './utils/supabaseUtils.ts';
import { AuthProvider } from './contexts/AuthContext';

// Create a global ENV object to store environment variables in the browser
// This allows us to access environment variables without using import.meta
if (typeof window !== 'undefined') {
  window.ENV = window.ENV || {};
  
  // Add any additional environment variables here if needed
  if (!window.ENV.VITE_FIRECRAWL_API_KEY) {
    window.ENV.VITE_FIRECRAWL_API_KEY = '';
  }
  
  if (!window.ENV.VITE_FIRECRAWL_API_URL) {
    window.ENV.VITE_FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1';
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      refetchOnWindowFocus: false, // Disable automatic refetch on window focus
      refetchOnMount: true, // Only refetch if stale
      retry: 1, // Only retry failed requests once
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchIntervalInBackground: false, // Don't refetch in the background
      refetchOnReconnect: true, // Refetch when reconnecting
    },
  },
});

// Set up focus tracking for React Query - but make it less aggressive
const focusHandler = () => {
  // Only invalidate queries if visibility has been hidden for more than 5 minutes
  if (document.visibilityState === 'visible') {
    // We'll handle refetching in individual components
    console.log('Window focused - not automatically invalidating queries');
  }
};

// Add event listener for visibility change
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', focusHandler);
}

// Initialize RPC functions in the background
initializeRpcFunctions().catch(console.error);

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
