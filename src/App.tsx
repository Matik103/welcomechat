
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
import { Toaster } from "sonner";
import NotFound from "@/pages/NotFound";

function App() {
  const { isLoading, user } = useAuth();
  const location = useLocation();
  
  // If we're on the callback route, show minimal loading UI
  if (location.pathname.includes('/auth/callback')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  
  // Determine if current route is a public route
  const isPublicRoute = location.pathname === '/auth' || 
                        location.pathname.includes('/auth/callback') ||
                        location.pathname.startsWith('/client/setup');
    
  // Show loading spinner during auth check, but only if not on a public route
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  // Auth page doesn't need layout or role checks
  if (location.pathname === '/auth') {
    return (
      <div className="min-h-screen bg-background">
        <Toaster />
        <Auth />
      </div>
    );
  }

  // Handle the case where we have user
  if (user) {
    // Determine if current route is a client-specific route
    const isClientRoute = 
      location.pathname.startsWith('/client') && 
      !location.pathname.startsWith('/client/setup');

    return (
      <div className="min-h-screen bg-background">
        {isClientRoute ? <ClientHeader /> : <Header />}
        <Routes>
          {/* Auth routes */}
          <Route path="/auth/*" element={<Navigate to="/" replace />} />
          <Route path="/client/setup" element={<ClientSetup />} />
          
          {/* All routes - users always get admin view */}
          <Route path="/" element={<Index />} />
          <Route path="/admin/clients" element={<ClientList />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin/clients/new" element={<AddEditClient />} />
          <Route path="/admin/clients/:id" element={<ClientView />} />
          <Route path="/admin/clients/:id/edit" element={<AddEditClient />} />
          <Route path="/admin/clients/:id/widget-settings" element={<WidgetSettings />} />
          
          {/* Client routes - redirect to admin dashboard */}
          <Route path="/client/*" element={<Navigate to="/" replace />} />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    );
  }

  // If auth is no longer loading but we don't have a user and we're not on a public route
  if (!isLoading && !user && !isPublicRoute) {
    return <Navigate to="/auth" replace />;
  }

  // Public routes with minimal loader
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Auth routes */}
        <Route path="/auth/*" element={<Auth />} />
        <Route path="/client/setup" element={<ClientSetup />} />
        
        {/* If trying to access restricted routes without auth, redirect */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
