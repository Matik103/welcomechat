
import { Toaster } from "sonner";
import { Header } from "@/components/layout/Header";
import { ClientHeader } from "@/components/layout/ClientHeader";
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ClientList from "@/pages/ClientList";
import Settings from "@/pages/Settings";
import ClientView from "@/pages/ClientView";
import AddEditClient from "@/pages/AddEditClient";
import WidgetSettings from "@/pages/WidgetSettings";
import { RoleRoute } from "@/components/auth/RoleRoute";
import { useAuth } from "./contexts/AuthContext";
import ClientSettings from "@/pages/client/Settings";
import ClientDashboard from "@/pages/client/Dashboard";
import ClientSetup from "@/pages/client/Setup";

function App() {
  const { isLoading, user } = useAuth();

  // Show loading spinner only for a brief moment while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If not loading and no user, show auth page
  if (!user && window.location.pathname !== '/auth' && !window.location.pathname.startsWith('/client/setup')) {
    return <Navigate to="/auth" replace />;
  }

  // Client routes use ClientHeader, admin routes use Header
  const isClientRoute = window.location.pathname.startsWith('/client');

  return (
    <div className="min-h-screen bg-background">
      {isClientRoute ? <ClientHeader /> : <Header />}
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/client/setup" element={<ClientSetup />} />
        
        {/* Admin Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/admin/clients" element={<ClientList />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin/clients/new" element={<AddEditClient />} />
        <Route path="/admin/clients/:id" element={<ClientView />} />
        <Route path="/admin/clients/:id/edit" element={<AddEditClient />} />
        <Route path="/admin/clients/:id/widget-settings" element={<WidgetSettings />} />
        
        {/* Client Routes */}
        <Route path="/client/view" element={<ClientDashboard />} />
        <Route path="/client/settings" element={<ClientSettings />} />
        <Route path="/client/edit" element={<AddEditClient />} />
        <Route path="/client/widget-settings" element={<WidgetSettings />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
