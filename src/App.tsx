import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleRoute } from "@/components/auth/RoleRoute";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Pages
import Auth from "@/pages/Auth";
import ClientAuth from "@/pages/client/Auth";
import ClientSetup from "@/pages/client/Setup";
import ClientView from "@/pages/client/View";
import AdminDashboard from "@/pages/admin/Dashboard";
import { useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isLoading, userRole } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/client/auth" element={<ClientAuth />} />
      <Route path="/client/setup" element={<ClientSetup />} />

      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        {/* Admin Routes */}
        <Route element={<RoleRoute allowedRole="admin" />}>
          <Route path="/" element={<AdminDashboard />} />
          {/* Add other admin routes here */}
        </Route>

        {/* Client Routes */}
        <Route element={<RoleRoute allowedRole="client" />}>
          <Route path="/client/view" element={<ClientView />} />
          {/* Add other client routes here */}
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={
        userRole === 'client' 
          ? <Navigate to="/client/view" replace /> 
          : <Navigate to="/" replace />
      } />
    </Routes>
  );
};

export const App = () => {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
};
