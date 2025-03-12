import { Toaster } from "sonner";
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
import ClientSetup from "@/pages/client/Setup";
import AccountSettings from "@/pages/client/AccountSettings";
import ResourceSettings from "@/pages/client/ResourceSettings";
import EditClientInfo from "@/pages/client/EditClientInfo";
import { Loader2 } from "lucide-react";

function App() {
  const { isLoading, user, userRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  const isPublicRoute = location.pathname === '/auth' || location.pathname.startsWith('/client/setup');
  
  if (!user && !isPublicRoute) {
    return <Navigate to="/auth" replace />;
  }

  const isClientRoute = location.pathname.startsWith('/client') && !location.pathname.startsWith('/client/setup');

  return (
    <div className="min-h-screen bg-background">
      {user && (isClientRoute ? <ClientHeader /> : <Header />)}
      <Routes>
        {/* Public routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/client/setup" element={<ClientSetup />} />
        
        {/* Protected routes */}
        {user && (
          <>
            {/* Admin routes */}
            {userRole === 'admin' && (
              <>
                <Route path="/" element={<Index />} />
                <Route path="/admin/clients" element={<ClientList />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin/clients/new" element={<AddEditClient />} />
                <Route path="/admin/clients/:id" element={<ClientView />} />
                <Route path="/admin/clients/:id/edit" element={<AddEditClient />} />
                <Route path="/admin/clients/:id/widget-settings" element={<WidgetSettings />} />
              </>
            )}

            {/* Client routes */}
            {userRole === 'client' && (
              <>
                <Route path="/client/view" element={<ClientDashboard />} />
                <Route path="/client/settings" element={<ClientSettings />} />
                <Route path="/client/widget-settings" element={<WidgetSettings />} />
                <Route path="/client/account-settings" element={<AccountSettings />} />
                <Route path="/client/resource-settings" element={<ResourceSettings />} />
                <Route path="/client/edit-info" element={<EditClientInfo />} />
              </>
            )}
          </>
        )}

        {/* Redirect based on role */}
        <Route path="*" element={
          <Navigate to={userRole === 'admin' ? '/' : '/client/view'} replace />
        } />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
