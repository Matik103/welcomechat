
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { RoleRoute } from './components/auth/RoleRoute';

// Import the ensure buckets utility
import { ensureStorageBuckets } from './utils/ensureStorageBuckets';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  // Check and ensure storage buckets on app startup
  useEffect(() => {
    ensureStorageBuckets()
      .catch(error => console.error("Failed to ensure storage buckets:", error));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/signup" element={<div>Signup Page</div>} />
            <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
            <Route path="/reset-password" element={<div>Reset Password Page</div>} />
            <Route path="/pricing" element={<div>Pricing Page</div>} />
            <Route path="/embed/:clientId" element={<div>Embed Page</div>} />
            <Route path="/ai-playground" element={<div>AI Playground Page</div>} />
            
            {/* Auth routes */}
            <Route path="/verify-email" element={<PrivateRoute><div>Verify Email Page</div></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><div>Dashboard Page</div></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><div>Settings Page</div></PrivateRoute>} />
            <Route path="/billing" element={<PrivateRoute><div>Billing Page</div></PrivateRoute>} />
            <Route path="/activity" element={<PrivateRoute><div>Activity Page</div></PrivateRoute>} />
            <Route path="/client/dashboard" element={<PrivateRoute><div>Client Dashboard Page</div></PrivateRoute>} />
            
            {/* Client Signup flow */}
            <Route path="/client/signup" element={<div>Client Signup Page</div>} />
            <Route path="/client/verify-email" element={<div>Client Verify Email Page</div>} />
            
            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={['admin']}><div>Admin Dashboard Page</div></RoleRoute>} />
            <Route path="/admin/clients" element={<RoleRoute allowedRoles={['admin']}><div>Admin Clients Page</div></RoleRoute>} />
            <Route path="/admin/clients/new" element={<RoleRoute allowedRoles={['admin']}><div>New Client Page</div></RoleRoute>} />
            <Route path="/admin/settings" element={<RoleRoute allowedRoles={['admin']}><div>Admin Settings Page</div></RoleRoute>} />
            <Route path="/admin/clients/:id" element={<RoleRoute allowedRoles={['admin']}><div>Edit Client Info Page</div></RoleRoute>} />
            
            {/* Common routes */}
            <Route path="/clients" element={<PrivateRoute><div>Clients Page</div></PrivateRoute>} />
            <Route path="/clients/:id" element={<PrivateRoute><div>Edit Client Info Page</div></PrivateRoute>} />
            <Route path="/create-client-account" element={<PrivateRoute><div>Create Client Account Page</div></PrivateRoute>} />
            
            {/* Default route */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
