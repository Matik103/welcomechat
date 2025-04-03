
import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoutes } from './components/routes/PublicRoutes';
import { UnauthenticatedRoutes } from './components/routes/UnauthenticatedRoutes';
import { ClientRoutes } from './components/routes/ClientRoutes';
import { AdminRoutes } from './components/routes/AdminRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/sonner';
import { Suspense } from 'react';
import { LoadingFallback } from './components/routes/LoadingFallback';
import initializeApp from './utils/appInitializer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 1,
    },
  },
});

function App() {
  useEffect(() => {
    // Initialize app when component mounts
    initializeApp().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<LoadingFallback />}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/*" element={<PublicRoutes />} />
              <Route path="/auth/*" element={<UnauthenticatedRoutes />} />
              <Route path="/client/*" element={<ClientRoutes />} />
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </Suspense>
    </QueryClientProvider>
  );
}

export default App;
