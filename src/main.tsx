
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App.tsx';
import './index.css';
import { initializeRpcFunctions } from './utils/supabaseUtils.ts';
import { AuthProvider } from './contexts/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      refetchOnWindowFocus: true, // Enable refetching when window gets focus
      refetchOnMount: 'always', // Always refetch on mount
      retry: 1, // Only retry failed requests once
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Add a refetch interval handler to customize behavior
      refetchIntervalInBackground: false, // Don't refetch in the background
      refetchOnReconnect: true, // Refetch when reconnecting
    },
  },
});

// Set up focus tracking for React Query
const focusHandler = () => {
  // Tell React Query that the window is focused
  if (document.visibilityState === 'visible') {
    queryClient.invalidateQueries();
    console.log('Window focused - invalidating queries');
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
