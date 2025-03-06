
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

function App() {
  const { isLoading, user, userRole } = useAuth();
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(true);
  
  // Set a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 3000); // Reduced timeout to 3 seconds
    
    // Clear timeout if loading state changes
    if (!isLoading) {
      clearTimeout(timer);
      setShowLoader(false);
    }
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Check if this is a public route
  const isPublicRoute = 
    location.pathname === '/auth' || 
    location.pathname.startsWith('/client/setup');
  
  // Show loading spinner only while checking auth and not more than the timeout
  if (isLoading && showLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
          <p className="text-sm text-gray-500">Loading your application...</p>
        </div>
      </div>
    );
  }

  // If loading timed out or finished, and no user, and not on a public route, redirect to auth
  if ((!isLoading || !showLoader) && !user && !isPublicRoute) {
    return <Navigate to="/auth" replace />;
  }

  // Determine if we need to show the client header or admin header
  // This is independent of role checks to avoid UI flickering
  const isClientRoute = 
    location.pathname.startsWith('/client') && 
    !location.pathname.startsWith('/client/setup');

  return (
    <div className="min-h-screen bg-background">
      {isClientRoute ? <ClientHeader /> : <Header />}
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/client/setup" element={<ClientSetup />} />
        
        {/* Admin Routes */}
        <Route path="/" element={
          userRole === 'client' ? <Navigate to="/client/view" replace /> : <Index />
        } />
        <Route path="/admin/clients" element={
          userRole === 'client' ? <Navigate to="/client/view" replace /> : <ClientList />
        } />
        <Route path="/settings" element={
          userRole === 'client' ? <Navigate to="/client/view" replace /> : <Settings />
        } />
        <Route path="/admin/clients/new" element={
          userRole === 'client' ? <Navigate to="/client/view" replace /> : <AddEditClient />
        } />
        <Route path="/admin/clients/:id" element={
          userRole === 'client' ? <Navigate to="/client/view" replace /> : <ClientView />
        } />
        <Route path="/admin/clients/:id/edit" element={
          userRole === 'client' ? <Navigate to="/client/view" replace /> : <AddEditClient />
        } />
        <Route path="/admin/clients/:id/widget-settings" element={
          userRole === 'client' ? <Navigate to="/client/widget-settings" replace /> : <WidgetSettings />
        } />
        
        {/* Client Routes */}
        <Route path="/client/view" element={
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
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
