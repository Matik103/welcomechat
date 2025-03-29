import { Header } from "@/components/layout/Header";
import { ClientHeader } from "@/components/layout/ClientHeader";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, useState, useEffect, useMemo } from "react";
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
import { isAdminClientConfigured, initializeBotLogosBucket } from "./integrations/supabase/client-admin";
import ErrorDisplay from "./components/ErrorDisplay";
import { useAuthSafetyTimeout } from "./hooks/useAuthSafetyTimeout";

const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function App() {
  const { user, userRole, isLoading, setIsLoading, session } = useAuth();
  const location = useLocation();
  const [adminConfigError, setAdminConfigError] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  
  const isAuthCallback = useMemo(() => location.pathname.includes('/auth/callback'), [location.pathname]);
  const isAuthPage = useMemo(() => location.pathname === '/auth', [location.pathname]);
  const isClientAuthPage = useMemo(() => location.pathname === '/client/auth', [location.pathname]);
  const isHomePage = useMemo(() => location.pathname === '/', [location.pathname]);
  const isAboutPage = useMemo(() => location.pathname === '/about', [location.pathname]);
  const isContactPage = useMemo(() => location.pathname === '/contact', [location.pathname]);
  const isPublicRoute = useMemo(() => (
    isAuthPage || isClientAuthPage || isAuthCallback || isHomePage || isAboutPage || isContactPage
  ), [isAuthPage, isClientAuthPage, isAuthCallback, isHomePage, isAboutPage, isContactPage]);
  
  useAuthSafetyTimeout({
    isLoading,
    setIsLoading,
    isAuthPage,
    session
  });
  
  useEffect(() => {
    const initializeApp = async () => {
      if (!isInitializing) return;
      
      if (!isAuthCallback) {
        sessionStorage.removeItem('auth_callback_processed');
      }
      
      console.log('Current path:', location.pathname);
      console.log('User authenticated:', !!user);
      console.log('User role:', userRole);
      console.log('Loading state:', isLoading);
      
      const isConfigured = isAdminClientConfigured();
      setAdminConfigError(!isConfigured);
      
      if (isConfigured) {
        try {
          await initializeBotLogosBucket();
        } catch (error) {
          console.error('Error initializing bot-logos bucket:', error);
        }
      }
      
      setIsInitializing(false);
    };
    
    initializeApp();
  }, [isAuthCallback, location.pathname, user, userRole, isLoading, isInitializing]);
  
  useEffect(() => {
    if (isLoading && location.pathname.includes('/dashboard')) {
      const timer = setTimeout(() => {
        console.log('Forcing loading state to complete due to dashboard path');
        setIsLoading(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, location.pathname, setIsLoading]);
  
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
  
  useEffect(() => {
    if (isLoading && !isInitializing) {
      const forceLoadingTimeout = setTimeout(() => {
        console.log('Forcing loading state to complete after timeout');
        setIsLoading(false);
      }, 5000);
      
      return () => clearTimeout(forceLoadingTimeout);
    }
  }, [isLoading, isInitializing, setIsLoading]);
  
  if (isLoading || isInitializing) {
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

  if (!userRole && user) {
    console.log('User is authenticated but role is not determined, defaulting to admin');
    return (
      <Navigate to="/admin/dashboard" replace />
    );
  }

  if (userRole === 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
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

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/client/dashboard" replace />} />
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
