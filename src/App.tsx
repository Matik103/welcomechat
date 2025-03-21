
import { Header } from "@/components/layout/Header";
import { ClientHeader } from "@/components/layout/ClientHeader";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ClientList from "@/pages/ClientList";
import Settings from "@/pages/Settings";
import ClientView from "@/pages/ClientView";
import AddEditClient from "@/pages/AddEditClient";
import WidgetSettings from "@/pages/WidgetSettings";
import { useAuth } from "./contexts/AuthContext";
import ClientSettings from "@/pages/client/Settings";
import ClientDashboard from "@/pages/client/Dashboard";
import AccountSettings from "@/pages/client/AccountSettings";
import ResourceSettings from "@/pages/client/ResourceSettings";
import EditClientInfo from "@/pages/EditClientInfo";
import { Toaster } from "sonner";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";

function App() {
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();
  
  const isAuthCallback = location.pathname.startsWith('/auth/callback');
  const isPublicRoute = location.pathname === '/auth' || isAuthCallback;
  
  useEffect(() => {
    if (!isAuthCallback) {
      sessionStorage.removeItem('auth_callback_processed');
    }
  }, [isAuthCallback]);
  
  if (isLoading || isAuthCallback) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
          <p className="text-sm text-muted-foreground">
            {isAuthCallback ? "Completing authentication..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/auth/*" element={<Auth />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
        <Toaster />
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
          <p className="text-sm text-muted-foreground">Loading user profile...</p>
        </div>
      </div>
    );
  }

  console.log("Rendering with user role:", userRole);

  if (userRole === 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Routes>
          <Route path="/admin/dashboard" element={<Index />} />
          <Route path="/admin/clients" element={<ClientList />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/clients/new" element={<AddEditClient />} />
          <Route path="/admin/clients/view/:clientId" element={<ClientView />} />
          <Route path="/admin/clients/:clientId/widget-settings" element={<WidgetSettings />} />
          <Route path="/admin/clients/:clientId/edit-info" element={<EditClientInfo />} />
          <Route path="/admin/clients/:clientId/edit" element={<AddEditClient />} />
          {/* Redirect the old route to the new view route */}
          <Route path="/admin/clients/:clientId" element={<Navigate to="/admin/clients/view/:clientId" replace />} />
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
          <Route path="/auth" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/auth/callback" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/client/*" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      <Routes>
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/settings" element={<ClientSettings />} />
        <Route path="/client/account-settings" element={<AccountSettings />} />
        <Route path="/client/resource-settings" element={<ResourceSettings />} />
        <Route path="/client/edit-info" element={<EditClientInfo />} />
        <Route path="/client/widget-settings" element={<WidgetSettings />} />
        <Route path="/auth" element={<Navigate to="/client/dashboard" replace />} />
        <Route path="/auth/callback" element={<Navigate to="/client/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/client/dashboard" replace />} />
        <Route path="/admin/*" element={<Navigate to="/client/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
