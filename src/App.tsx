
import { Header } from "@/components/layout/Header";
import { ClientHeader } from "@/components/layout/ClientHeader";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, useState, useEffect } from "react";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ClientList from "@/pages/ClientList";
import Settings from "@/pages/Settings";
import ClientView from "@/pages/ClientView";
import WidgetSettings from "@/pages/WidgetSettings";
import { useAuth } from "./contexts/AuthContext";
import ClientSettings from "@/pages/client/Settings";
import ClientDashboard from "@/pages/client/Dashboard";
import AccountSettings from "@/pages/client/AccountSettings";
import ResourceSettings from "@/pages/client/ResourceSettings";
import EditClientInfo from "@/pages/EditClientInfo";
import { Toaster } from "sonner";
import NotFound from "@/pages/NotFound";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Agents from "@/pages/Agents";
import ClientAuth from "@/pages/client/Auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";
import { isAdminClientConfigured } from "./integrations/supabase/client-admin";
import ErrorDisplay from "./components/ErrorDisplay";
import { useAuthSafetyTimeout } from "./hooks/useAuthSafetyTimeout";

// Loading component for Suspense fallbacks
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function App() {
  const { user, userRole, isLoading, setIsLoading } = useAuth();
  const location = useLocation();
  const [adminConfigError, setAdminConfigError] = useState<boolean>(false);
  
  const isAuthCallback = location.pathname.includes('/auth/callback');
  const isAuthPage = location.pathname === '/auth';
  const isClientAuthPage = location.pathname === '/client/auth';
  const isHomePage = location.pathname === '/';
  const isAboutPage = location.pathname === '/about';
  const isContactPage = location.pathname === '/contact';
  const isPublicRoute = isAuthPage || isClientAuthPage || isAuthCallback || isHomePage || isAboutPage || isContactPage;
  
  // Use the safety timeout hook to prevent infinite loading
  useAuthSafetyTimeout({
    isLoading,
    setIsLoading,
    isAuthPage,
    session: user ? { user } : null
  });
  
  useEffect(() => {
    if (!isAuthCallback) {
      sessionStorage.removeItem('auth_callback_processed');
    }
    
    // Debug statements to help identify current state
    console.log('Current path:', location.pathname);
    console.log('User authenticated:', !!user);
    console.log('User role:', userRole);
    console.log('Loading state:', isLoading);
    
    // Check if admin client is configured
    setAdminConfigError(!isAdminClientConfigured());
    
    // Force loading to false after short timeout if we're on dashboard
    if (location.pathname.includes('/dashboard') && isLoading) {
      const timer = setTimeout(() => {
        console.log('Forcing loading state to complete due to dashboard path');
        setIsLoading(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthCallback, location.pathname, user, userRole, isLoading, setIsLoading]);
  
  // Show error if admin client is not configured properly
  if (adminConfigError) {
    return (
      <div className="min-h-screen bg-background p-4">
        <ErrorDisplay 
          title="Configuration Error" 
          message="The application is missing required Supabase configuration." 
          details="The VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is missing or empty. This key is required for admin operations such as bucket management."
        />
        <Toaster />
      </div>
    );
  }
  
  // Check if we're still loading but it's been too long (more than 5 seconds)
  // This helps prevent infinite loading states
  useEffect(() => {
    if (isLoading) {
      const forceLoadingTimeout = setTimeout(() => {
        console.log('Forcing loading state to complete after timeout');
        setIsLoading(false);
      }, 5000);
      
      return () => clearTimeout(forceLoadingTimeout);
    }
  }, [isLoading, setIsLoading]);
  
  // Show loader during authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">
            {isAuthCallback ? "Completing authentication..." : "Loading your dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated and on home page
  if (!user && isHomePage) {
    return <Navigate to="/auth" replace />;
  }

  // Show public routes when not authenticated
  if (!user && isPublicRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth/*" element={<Auth />} />
            <Route path="/client/auth" element={<ClientAuth />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </Suspense>
        <Toaster />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/auth/*" element={<Auth />} />
            <Route path="/client/auth" element={<ClientAuth />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </Suspense>
        <Toaster />
      </div>
    );
  }

  // If user is authenticated but role is not determined, set a default role after timeout
  if (!userRole && user) {
    console.log('User is authenticated but role is not determined, defaulting to admin');
    // Default to admin role if role determination is taking too long
    return (
      <Navigate to="/admin/dashboard" replace />
    );
  }

  // Admin routes
  if (userRole === 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin/dashboard" element={<Index />} />
            <Route path="/admin/clients" element={<ClientList />} />
            <Route path="/admin/agents" element={<Agents />} />
            <Route path="/admin/agents/:agentId" element={<Agents />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/admin/clients/view/:clientId" element={<ClientView />} />
            <Route path="/admin/clients/:clientId/widget-settings" element={<WidgetSettings />} />
            <Route path="/admin/clients/:id/edit-info" element={<EditClientInfo />} />
            <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
            <Route path="/auth" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/auth/callback" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/client/*" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster />
      </div>
    );
  }

  // Client routes
  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<ClientDashboard />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/settings" element={<ClientSettings />} />
          <Route path="/client/account-settings" element={<AccountSettings />} />
          <Route path="/client/resource-settings" element={<ResourceSettings />} />
          <Route path="/client/edit-info" element={<EditClientInfo />} />
          <Route path="/client/widget-settings" element={<WidgetSettings />} />
          <Route path="/auth" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/auth/callback" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/admin/*" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster />
    </div>
  );
}

export default App;
