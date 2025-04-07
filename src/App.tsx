
import { useMemo, useCallback, Suspense, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { PublicRoutes } from "./components/routes/PublicRoutes";
import { UnauthenticatedRoutes } from "./components/routes/UnauthenticatedRoutes";
import { AdminRoutes } from "./components/routes/AdminRoutes";
import { ClientRoutes } from "./components/routes/ClientRoutes";
import { LoadingFallback } from "./components/routes/LoadingFallback";
import { toast } from "sonner";

function App() {
  const { user, userRole, isLoading, session, refreshUserRole } = useAuth();
  const location = useLocation();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [localLoadingState, setLocalLoadingState] = useState<boolean>(true);
  
  // Memoize route checks to prevent unnecessary re-renders
  const isAuthCallback = useMemo(() => location.pathname.includes('/auth/callback'), [location.pathname]);
  const isAuthPage = useMemo(() => location.pathname === '/auth', [location.pathname]);
  const isClientAuthPage = useMemo(() => location.pathname === '/client/auth', [location.pathname]);
  const isHomePage = useMemo(() => location.pathname === '/', [location.pathname]);
  const isAboutPage = useMemo(() => location.pathname === '/about', [location.pathname]);
  const isContactPage = useMemo(() => location.pathname === '/contact', [location.pathname]);
  
  // Use effect to prevent getting stuck in loading state
  useEffect(() => {
    // Set a maximum timeout for the loading state
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("App loading timeout triggered, forcing state update");
        setLocalLoadingState(false);
        
        // Try to refresh user role again if we have a user but no role
        if (user && !userRole && refreshUserRole) {
          refreshUserRole();
        }
      }
    }, 3000); // 3 seconds timeout
    
    return () => clearTimeout(loadingTimeout);
  }, [isLoading, user, userRole, refreshUserRole]);
  
  // Clear loading state when we have definitive answers
  useEffect(() => {
    if (user && userRole) {
      setLocalLoadingState(false);
    } else if (!isLoading && !user) {
      setLocalLoadingState(false);
    }
  }, [user, userRole, isLoading]);
  
  // Create a stable isPublicRoute value with useCallback to prevent unnecessary recalculations
  const isPublicRoute = useCallback(() => {
    return (
      isAuthPage || 
      isClientAuthPage || 
      isAuthCallback || 
      isHomePage || 
      isAboutPage || 
      isContactPage
    );
  }, [isAuthPage, isClientAuthPage, isAuthCallback, isHomePage, isAboutPage, isContactPage]);

  // Error recovery handler
  const handleLoadingComplete = useCallback(() => {
    console.log("Fallback loading timeout triggered");
    if (isLoading) {
      toast.warning("Loading is taking longer than expected", {
        description: "Attempting to recover..."
      });
      setLoadError(null);
    }
  }, [isLoading]);

  // Use useMemo to avoid unnecessary re-renders of entire route components
  const routeComponent = useMemo(() => {
    // If we're in auth callback, short-circuit to show minimal loading UI
    if (isAuthCallback) {
      return <LoadingFallback message="Processing authentication..." />;
    }
    
    // Show loading only if in global loading state and not on public routes
    const shouldShowLoading = (isLoading || localLoadingState) && !isPublicRoute();
    
    if (shouldShowLoading) {
      return (
        <LoadingFallback 
          onTimeoutAction={handleLoadingComplete}
          message={isAuthPage ? "Authenticating..." : "Loading application..."}
        />
      );
    }

    if (loadError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-md text-center">
            <h2 className="text-red-700 text-xl mb-2">Application Error</h2>
            <p className="text-red-600 mb-4">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    // Public routes for non-authenticated users
    if (!user && isPublicRoute()) {
      return <PublicRoutes />;
    }

    // Non-authenticated user routes
    if (!user) {
      return <UnauthenticatedRoutes />;
    }

    // Render based on user role - only calculate this when user and userRole are available
    if (user) {
      try {
        if (userRole === 'admin') {
          return (
            <Suspense fallback={<LoadingFallback message="Loading admin dashboard..." />}>
              <AdminRoutes />
            </Suspense>
          );
        }
        
        if (userRole === 'client') {
          return (
            <Suspense fallback={<LoadingFallback message="Loading client dashboard..." />}>
              <ClientRoutes />
            </Suspense>
          );
        }
        
        // If user is authenticated but role not determined yet, treat as loading
        if (!userRole) {
          return <LoadingFallback message="Determining user access..." timeoutSeconds={5} />;
        }
      } catch (error) {
        console.error("Error rendering routes:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        setLoadError(`Error loading application: ${errorMessage}`);
        return <LoadingFallback message="Error occurred. Attempting to recover..." />;
      }
    }
    
    // Default to home page as fallback
    return <Navigate to="/" replace />;
  }, [user, userRole, isLoading, isPublicRoute, isAuthCallback, localLoadingState, loadError, isAuthPage, handleLoadingComplete]);
  
  // Return the memoized route component
  return routeComponent;
}

export default App;
