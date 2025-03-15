
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
import { Toaster } from "sonner";

function App() {
  const { isLoading, user, userRole } = useAuth();
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(true);
  
  useEffect(() => {
    // Set a maximum wait time for loader display (5 seconds)
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 5000);
    
    // If auth completes before timeout, clear the timer and hide loader
    if (!isLoading) {
      clearTimeout(timer);
      setShowLoader(false);
    }
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Determine if current route is a public route (auth, setup, or callback)
  const isPublicRoute = 
    location.pathname === '/auth' || 
    location.pathname.includes('/auth/callback') ||
    location.pathname.startsWith('/client/setup');
  
  // Special case for OAuth redirect routes
  const isOAuthRedirect = 
    location.pathname.includes('/auth/callback') || 
    (location.pathname === '/auth' && window.location.hash && window.location.hash.includes('access_token'));
  
  // Show loading spinner while authenticating, but with a time limit via showLoader
  if ((isLoading && showLoader) || (isOAuthRedirect && showLoader)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
          <p className="text-sm text-gray-500">Loading your application...</p>
          {showLoader && isOAuthRedirect && (
            <p className="text-xs text-gray-400 max-w-xs text-center">
              Processing authentication. If this takes too long, try refreshing the page.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to auth page, except for public routes
  if ((!isLoading || !showLoader) && !user && !isPublicRoute) {
    return <Navigate to="/auth" replace />;
  }

  // Determine if current route is a client-specific route
  const isClientRoute = 
    location.pathname.startsWith('/client') && 
    !location.pathname.startsWith('/client/setup');

  return (
    <div className="min-h-screen bg-background">
      {isClientRoute ? <ClientHeader /> : <Header />}
      <Routes>
        {/* Auth routes */}
        <Route path="/auth/*" element={<Auth />} />
        <Route path="/client/setup" element={<ClientSetup />} />
        
        {/* Main routes with role-based routing */}
        <Route path="/" element={
          userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <Index />
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
