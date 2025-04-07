
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

// Global error handling for uncaught exceptions
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  // Prevent blank screen by showing error UI
  const errorContainer = document.getElementById('error-container');
  if (!errorContainer) {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const newErrorContainer = document.createElement('div');
      newErrorContainer.id = 'error-container';
      newErrorContainer.innerHTML = `
        <div style="padding: 20px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin: 20px; text-align: center;">
          <h2>Something went wrong</h2>
          <p>The application encountered an error. Please try refreshing the page.</p>
          <button onclick="window.location.reload()" style="padding: 8px 16px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Refresh
          </button>
        </div>
      `;
      
      // If the app is completely blank, append to body
      if (!rootElement.children.length) {
        rootElement.appendChild(newErrorContainer);
      }
    }
  }
});

// Don't initialize RPC functions immediately to prevent blocking the app load
// Use a safer initialization approach with proper error handling
setTimeout(() => {
  initializeRpcFunctions().catch(err => {
    console.error('Failed to initialize RPC functions:', err);
    // Retry once after a delay
    setTimeout(() => {
      initializeRpcFunctions().catch(error => {
        console.error('Failed to initialize RPC functions on retry:', error);
        // Show a user-friendly toast
        const toast = document.querySelector('.Toaster');
        if (!toast) {
          console.log('Some features may not be available due to connection issues');
        }
      });
    }, 5000);
  });
}, 2000);

// Use a try-catch block to prevent the app from completely crashing
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  ReactDOM.createRoot(rootElement).render(
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
} catch (error) {
  console.error('Failed to render application:', error);
  
  // Create a minimal error UI if rendering fails
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin: 20px; text-align: center;">
        <h2>Application Error</h2>
        <p>Failed to load the application. Please try refreshing the page.</p>
        <button onclick="window.location.reload()" style="padding: 8px 16px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Refresh
        </button>
      </div>
    `;
  }
}
