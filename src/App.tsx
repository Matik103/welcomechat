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
import { useEffect, useState } from "react";
import AccountSettings from "@/pages/client/AccountSettings";
import ResourceSettings from "@/pages/client/ResourceSettings";
import EditClientInfo from "@/pages/client/EditClientInfo";

function App() {
  const { isLoading, user, userRole } = useAuth();
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1000);
    
    if (!isLoading) {
      clearTimeout(timer);
      setShowLoader(false);
    }
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  const isPublicRoute = 
    location.pathname === '/auth' || 
    location.pathname.startsWith('/client/setup');

  // Early return for loading states to prevent any flash of content
  if (isLoading || showLoader || (user && userRole === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
          <p className="text-sm text-gray-500">Loading your application...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated and not on a public route
  if (!user && !isPublicRoute) {
    return <Navigate to="/auth" replace />;
  }

  // Immediate redirect for clients to their dashboard if they're on any non-client route
  if (user && userRole === 'client' && !location.pathname.startsWith('/client/')) {
    return <Navigate to="/client/dashboard" replace />;
  }

  const isClientRoute = 
    location.pathname.startsWith('/client') && 
    !location.pathname.startsWith('/client/setup');

  return (
    <div className="min-h-screen bg-background">
      {isClientRoute ? <ClientHeader /> : <Header />}
      <Routes>
        {/* Public routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/client/setup" element={<ClientSetup />} />
        
        {/* Protected routes with role-based access */}
        <Route path="/" element={
          !user ? <Navigate to="/auth" replace /> :
          userRole === 'client' ? <Navigate to="/client/dashboard" replace /> :
          userRole === 'admin' ? <Index /> :
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        } />
        
        {/* Admin routes */}
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
        
        {/* Client routes */}
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
      <Toaster />
    </div>
  );
}

export default App;
