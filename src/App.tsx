import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { RoleRoute } from "@/components/auth/RoleRoute";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// Pages
import Auth from "@/pages/Auth";
import ClientAuth from "@/pages/client/Auth";
import ClientSetup from "@/pages/client/Setup";
import ClientView from "@/pages/client/View";
import ClientDashboard from "@/pages/client/Dashboard";
import ClientSettings from "@/pages/client/Settings";
import ClientResourceSettings from "@/pages/client/ResourceSettings";
import ClientEditInfo from "@/pages/client/EditClientInfo";
import ClientAccountSettings from "@/pages/client/AccountSettings";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminClients from "@/pages/admin/Clients";
import AdminSettings from "@/pages/admin/Settings";

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Main App component
export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/client/auth" element={<ClientAuth />} />
          <Route path="/client/setup" element={<ClientSetup />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            {/* Admin Routes */}
            <Route element={<RoleRoute allowedRole="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/clients" element={<AdminClients />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            {/* Client Routes */}
            <Route element={<RoleRoute allowedRole="client" />}>
              {/* Main Views */}
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/view" element={<ClientView />} />
              
              {/* Settings */}
              <Route path="/client/settings" element={<ClientSettings />} />
              <Route path="/client/resource-settings" element={<ClientResourceSettings />} />
              <Route path="/client/account-settings" element={<ClientAccountSettings />} />
              <Route path="/client/edit-info" element={<ClientEditInfo />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
        <Toaster 
          position="top-right" 
          closeButton
          richColors
        />
      </Suspense>
    </ErrorBoundary>
  );
}
