
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
    location.pathname.startsWith('/client/setup') ||
    location.pathname.startsWith('/auth/callback');
  
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

  // Immediate role-based redirects
  if (!isLoading && user && userRole) {
    // If user is client and trying to access admin routes, redirect to client dashboard
    if (userRole === 'client' && 
        !location.pathname.startsWith('/client/') && 
        !location.pathname.startsWith('/auth')) {
      return <Navigate to="/client/view" replace />;
    }
    
    // If user is admin and trying to access client routes, redirect to admin dashboard
    if (userRole === 'admin' && 
        location.pathname.startsWith('/client/') && 
        !location.pathname.startsWith('/client/setup')) {
      return <Navigate to="/" replace />;
    }
  }

  // Client routes use ClientHeader, admin routes use Header
  const isClientRoute = location.pathname.startsWith('/client');

  return (
    <div className="min-h-screen bg-background">
      {isClientRoute ? <ClientHeader /> : <Header />}
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<Auth />} />
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
        <Route path="/client/edit" element={<AddEditClient isClientView={true} />} />
        <Route path="/client/widget-settings" element={<WidgetSettings />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
