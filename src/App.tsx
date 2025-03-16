
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
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();
  
  // Handle special routes
  const isAuthCallback = location.pathname.startsWith('/auth/callback');
  const isPublicRoute = location.pathname === '/auth' || 
                        isAuthCallback ||
                        location.pathname.startsWith('/client/setup');
  
  // Show loading state if auth is initializing
  if (isLoading || isAuthCallback) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Guest view - only public routes
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public routes */}
          <Route path="/auth/*" element={<Auth />} />
          <Route path="/client/setup" element={<ClientSetup />} />
          
          {/* Redirect any other path to auth */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
        <Toaster />
      </div>
    );
  }

  // User authenticated but roles not determined yet
  if (!userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Admin view with admin routes
  if (userRole === 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Routes>
          {/* Admin routes with clearer naming structure */}
          <Route path="/admin/dashboard" element={<Index />} />
          <Route path="/admin/clients" element={<ClientList />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/clients/new" element={<AddEditClient />} />
          <Route path="/admin/clients/:id" element={<ClientView />} />
          <Route path="/admin/clients/:id/edit" element={<AddEditClient />} />
          <Route path="/admin/clients/:id/widget-settings" element={<WidgetSettings />} />
          
          {/* Redirect old admin routes to new structure */}
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
          
          {/* Auth callbacks and redirects */}
          <Route path="/auth" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/auth/callback" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* Prevent access to client routes */}
          <Route path="/client/*" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* 404 for admin routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    );
  }

  // Client view with client routes
  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      <Routes>
        {/* Client routes - already well-structured */}
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/settings" element={<ClientSettings />} />
        <Route path="/client/account-settings" element={<AccountSettings />} />
        <Route path="/client/resource-settings" element={<ResourceSettings />} />
        <Route path="/client/edit-info" element={<EditClientInfo />} />
        <Route path="/client/widget-settings" element={<WidgetSettings />} />
        <Route path="/client/setup" element={<ClientSetup />} />
        
        {/* Auth callbacks and redirects */}
        <Route path="/auth" element={<Navigate to="/client/dashboard" replace />} />
        <Route path="/auth/callback" element={<Navigate to="/client/dashboard" replace />} />
        
        {/* Redirect root and admin routes to client dashboard */}
        <Route path="/" element={<Navigate to="/client/dashboard" replace />} />
        <Route path="/admin/*" element={<Navigate to="/client/dashboard" replace />} />
        
        {/* 404 for client routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
