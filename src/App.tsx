
import { useMemo, useEffect } from "react";
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

  // Check for stored auth state
  useEffect(() => {
    const storedState = sessionStorage.getItem('auth_state');
    if (storedState) {
      try {
        const { timestamp } = JSON.parse(storedState);
        // If we have recent stored state, don't show loading
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking stored auth state:', error);
      }
    }
  }, [setIsLoading]);
  
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
  
  // Only show loading state if we're initializing or in an auth callback
  const shouldShowLoading = (isLoading && isAuthCallback) || isInitializing;
  
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
    console.log('User is authenticated but role is not determined, defaulting to admin');
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Admin routes
  if (userRole === 'admin') {
    return <AdminRoutes />;
  }

  // Client routes (default)
  return <ClientRoutes />;
}

export default App;
