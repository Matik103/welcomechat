import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import RoleRoute from './components/auth/RoleRoute';

// Page imports
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import EditClientInfo from './pages/EditClientInfo';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CreateClientAccount from './pages/CreateClientAccount';
import AdminDashboard from './pages/AdminDashboard';
import AdminClients from './pages/AdminClients';
import NewClient from './pages/NewClient';
import ClientDashboard from './pages/ClientDashboard';
import Pricing from './pages/Pricing';
import Billing from './pages/Billing';
import Activity from './pages/Activity';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import Embed from './pages/Embed';
import AiPlayground from './pages/AiPlayground';
import AdminSettings from './pages/AdminSettings';
import ClientSignup from './pages/ClientSignup';
import ClientVerifyEmail from './pages/ClientVerifyEmail';
import { checkAndRefreshAuth } from './services/authService';
import { useAuth } from './contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useEffectOnce } from 'usehooks-ts';
import { handleSession } from './services/authService';
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

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
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/embed/:clientId" element={<Embed />} />
            <Route path="/ai-playground" element={<AiPlayground />} />
            
            {/* Auth routes */}
            <Route path="/verify-email" element={<PrivateRoute><VerifyEmail /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
            <Route path="/activity" element={<PrivateRoute><Activity /></PrivateRoute>} />
            <Route path="/client/dashboard" element={<PrivateRoute><ClientDashboard /></PrivateRoute>} />
            
            {/* Client Signup flow */}
            <Route path="/client/signup" element={<ClientSignup />} />
            <Route path="/client/verify-email" element={<ClientVerifyEmail />} />
            
            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>} />
            <Route path="/admin/clients" element={<RoleRoute allowedRoles={['admin']}><AdminClients /></RoleRoute>} />
            <Route path="/admin/clients/new" element={<RoleRoute allowedRoles={['admin']}><NewClient /></RoleRoute>} />
            <Route path="/admin/settings" element={<RoleRoute allowedRoles={['admin']}><AdminSettings /></RoleRoute>} />
            <Route path="/admin/clients/:id" element={<RoleRoute allowedRoles={['admin']}><EditClientInfo /></RoleRoute>} />
            
            {/* Common routes */}
            <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
            <Route path="/clients/:id" element={<PrivateRoute><EditClientInfo /></PrivateRoute>} />
            <Route path="/create-client-account" element={<PrivateRoute><CreateClientAccount /></PrivateRoute>} />
            
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
