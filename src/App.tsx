
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
import { toast } from "sonner";

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

  // Super aggressive loading timeout - guarantee we don't get stuck
  useEffect(() => {
    const hardTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Hard timeout triggered after 2.5 seconds");
        setIsLoading(false);
        toast.error("Loading timed out. Please refresh if you experience issues.");
      }
    }, 2500);
    
    return () => clearTimeout(hardTimeout);
  }, [isLoading, setIsLoading]);

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
  
  // Enhanced loading state handling with shorter timeout for client routes
  useEffect(() => {
    if (isLoading && location.pathname.includes('/client/')) {
      const clientRouteTimeout = setTimeout(() => {
        console.log("Client route detected - using shorter loading timeout");
        setIsLoading(false);
      }, 800); // Even shorter timeout for client routes
      
      return () => clearTimeout(clientRouteTimeout);
    }
  }, [isLoading, location.pathname, setIsLoading]);
  
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
  
  // Force complete loading state after initialization - more aggressive timeout
  useEffect(() => {
    if (isInitializing) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000); // Reduced from 1500ms
      return () => clearTimeout(timer);
    }
  }, [isInitializing, setIsLoading]);
  
  // Only show loading state if we're initializing or in an auth callback - with time limit
  const shouldShowLoading = (isLoading && isAuthCallback) || (isInitializing && initialRender);
  
  // If loading takes more than 3 seconds, force render the app anyway
  useEffect(() => {
    if (shouldShowLoading) {
      const forceRenderTimeout = setTimeout(() => {
        setIsLoading(false);
        setInitialRender(false);
      }, 3000);
      return () => clearTimeout(forceRenderTimeout);
    }
  }, [shouldShowLoading, setIsLoading]);
  
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">
            {isAuthCallback ? "Completing authentication..." : "Loading your dashboard..."}
          </p>
          <button 
            className="mt-4 text-sm text-primary underline cursor-pointer"
            onClick={() => {
              setIsLoading(false);
              window.location.reload();
            }}
          >
            Taking too long? Click to reload
          </button>
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

  // User authenticated but role not determined - use metadata as fallback
  if (!userRole && user) {
    const roleFromMetadata = user.user_metadata?.role;
    
    if (roleFromMetadata === 'admin') {
      return <AdminRoutes />;
    } else if (roleFromMetadata === 'client') {
      return <ClientRoutes />;
    }
    
    // Default to client view if we can't determine role
    console.log('User is authenticated but role is not determined, defaulting to client view');
    return <ClientRoutes />;
  }

  // Admin routes
  if (userRole === 'admin') {
    return <AdminRoutes />;
  }

  // Client routes (default)
  return <ClientRoutes />;
}

export default App;
