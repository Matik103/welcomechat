import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ClientHeader } from "@/components/layout/ClientHeader";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ClientList from "@/pages/ClientList";
import Settings from "@/pages/Settings";
import ClientView from "@/pages/ClientView";
import AddEditClient from "@/pages/AddEditClient";
import WidgetSettings from "@/pages/WidgetSettings";
import ClientSettings from "@/pages/client/Settings";
import ClientDashboard from "@/pages/client/Dashboard";
import ClientSetup from "@/pages/client/Setup";
import AccountSettings from "@/pages/client/AccountSettings";
import ResourceSettings from "@/pages/client/ResourceSettings";
import EditClientInfo from "@/pages/client/EditClientInfo";
import { LoadingScreen } from "@/components/layout/LoadingScreen";

export const AppRoutes = () => {
  const { isLoading, user, userRole } = useAuth();
  const location = useLocation();

  const isPublicRoute = 
    location.pathname === '/auth' || 
    location.pathname.startsWith('/client/setup');

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user && !isPublicRoute) {
    return <Navigate to="/auth" replace />;
  }

  const isClientRoute = 
    location.pathname.startsWith('/client') && 
    !location.pathname.startsWith('/client/setup');

  return (
    <div className="min-h-screen bg-background">
      {isClientRoute ? <ClientHeader /> : <Header />}
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/client/setup" element={<ClientSetup />} />
        
        <Route path="/" element={
          userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <Index />
        } />
        <Route path="/admin/clients" element={
          userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <ClientList />
        } />
        <Route path="/settings" element={
          userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <Settings />
        } />
        <Route path="/admin/clients/new" element={
          userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <AddEditClient />
        } />
        <Route path="/admin/clients/:id" element={
          userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <ClientView />
        } />
        <Route path="/admin/clients/:id/edit" element={
          userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <AddEditClient />
        } />
        <Route path="/admin/clients/:id/widget-settings" element={
          userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <WidgetSettings />
        } />
        
        <Route path="/client/view" element={
          <Navigate to="/client/dashboard" replace />
        } />
        <Route path="/client/dashboard" element={
          userRole === 'admin' ? <Navigate to="/" replace /> : <ClientDashboard />
        } />
        <Route path="/client/settings" element={
          userRole === 'admin' ? <Navigate to="/settings" replace /> : <ClientSettings />
        } />
        <Route path="/client/widget-settings" element={
          userRole === 'admin' ? <Navigate to="/" replace /> : <WidgetSettings />
        } />
        <Route path="/client/account-settings" element={
          userRole === 'admin' ? <Navigate to="/" replace /> : <AccountSettings />
        } />
        <Route path="/client/resource-settings" element={
          userRole === 'admin' ? <Navigate to="/" replace /> : <ResourceSettings />
        } />
        <Route path="/client/edit-info" element={
          userRole === 'admin' ? <Navigate to="/" replace /> : <EditClientInfo />
        } />
        
        {/* Catch-all route for 404s */}
        <Route path="*" element={
          <Navigate to={userRole === 'admin' ? '/' : '/client/dashboard'} replace />
        } />
      </Routes>
    </div>
  );
}; 