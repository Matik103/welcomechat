
import { useMemo, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useAuthSafetyTimeout } from "./hooks/useAuthSafetyTimeout";
import { useAppInitialization } from "./hooks/useAppInitialization";
import { Loader2 } from "lucide-react";
import { PublicRoutes } from "./components/routes/PublicRoutes";
import { UnauthenticatedRoutes } from "./components/routes/UnauthenticatedRoutes";
import { AdminRoutes } from "./components/routes/AdminRoutes";
import { ClientRoutes } from "./components/routes/ClientRoutes";
import { ConfigError } from "./components/routes/ErrorDisplay";

function App() {
  const { user, userRole, isLoading, setIsLoading, session } = useAuth();
  const location = useLocation();
  const [initialRender, setInitialRender] = useState(true);
  
  // Check if current path is a public route
  const isAuthCallback = useMemo(() => location.pathname.includes('/auth/callback'), [location.pathname]);
  const isAuthPage = useMemo(() => location.pathname === '/auth', [location.pathname]);
  const isClientAuthPage = useMemo(() => location.pathname === '/client/auth', [location.pathname]);
  const isHomePage = useMemo(() => location.pathname === '/', [location.pathname]);
  const isAboutPage = useMemo(() => location.pathname === '/about', [location.pathname]);
  const isContactPage = useMemo(() => location.pathname === '/contact', [location.pathname]);
  const isPublicRoute = useMemo(() => (
    isAuthPage || isClientAuthPage || isAuthCallback || isHomePage || isAboutPage || isContactPage
  ), [isAuthPage, isClientAuthPage, isAuthCallback, isHomePage, isAboutPage, isContactPage]);

  // Debug current route for troubleshooting
  useEffect(() => {
    console.log('Current path:', location.pathname);
    console.log('Is public route:', isPublicRoute);
    console.log('Auth state:', { user, userRole, isLoading });
  }, [location.pathname, isPublicRoute, user, userRole, isLoading]);

  // Force complete initial render after a short timeout
  useEffect(() => {
    if (initialRender) {
      const timer = setTimeout(() => {
        setInitialRender(false);
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialRender, setIsLoading]);
  
  // Enhanced loading state handling with shorter timeout
  useEffect(() => {
    // Shorter timeout for client routes
    if (isLoading && location.pathname.includes('/client/')) {
      const clientRouteTimeout = setTimeout(() => {
        console.log("Client route detected - using shorter loading timeout");
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(clientRouteTimeout);
    }
    
    // General loading timeout as a fallback
    if (isLoading && !isAuthCallback) {
      const generalTimeout = setTimeout(() => {
        console.log("General timeout triggered to prevent infinite loading");
        setIsLoading(false);
      }, 2000);
      
      return () => clearTimeout(generalTimeout);
    }
  }, [isLoading, location.pathname, isAuthCallback, setIsLoading]);
  
  // Initialize timeout for auth loading
  useAuthSafetyTimeout({
    isLoading,
    setIsLoading,
    isAuthPage,
    session
  });
  
  // Handle app initialization
  const { adminConfigError, isInitializing } = useAppInitialization(
    isLoading, 
    user, 
    userRole, 
    setIsLoading
  );
  
  // Show configuration error if Supabase is not configured correctly
  if (adminConfigError) {
    return (
      <ConfigError 
        message="The application is missing required Supabase configuration." 
        details="The VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is missing or empty. This key is required for admin operations such as bucket management."
      />
    );
  }
  
  // Force complete loading state after initialization
  useEffect(() => {
    if (isInitializing) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isInitializing, setIsLoading]);
  
  // Only show loading state if we're initializing or in an auth callback
  const shouldShowLoading = (isLoading && isAuthCallback) || (isInitializing && initialRender);
  
  if (shouldShowLoading) {
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

  // Public route rendering for non-authenticated users
  if (!user && isPublicRoute) {
    return <PublicRoutes />;
  }

  // Non-authenticated user routes
  if (!user) {
    return <UnauthenticatedRoutes />;
  }

  // User authenticated but role not determined
  if (!userRole && user) {
    const roleFromMetadata = user.user_metadata?.role;
    
    if (roleFromMetadata === 'admin') {
      return <AdminRoutes />;
    } else if (roleFromMetadata === 'client') {
      return <ClientRoutes />;
    }
    
    console.log('User is authenticated but role is not determined, defaulting to client view');
    return <Navigate to="/client/dashboard" replace />;
  }

  // Admin routes
  if (userRole === 'admin') {
    return <AdminRoutes />;
  }

  // Client routes (default)
  return <ClientRoutes />;
}

export default App;
