
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
  const [recoveryAttempted, setRecoveryAttempted] = useState<boolean>(false);

  // Sanitize location to prevent XSS 
  const sanitizedPathname = useMemo(() => {
    if (!location.pathname) return '/';
    // Remove potential script tags and dangerous content
    return location.pathname.replace(/<\/?[^>]+(>|$)/g, "");
  }, [location.pathname]);
  
  // Memoize route checks to prevent unnecessary re-renders
  const isAuthCallback = useMemo(() => sanitizedPathname.includes('/auth/callback'), [sanitizedPathname]);
  const isAuthPage = useMemo(() => sanitizedPathname === '/auth', [sanitizedPathname]);
  const isClientAuthPage = useMemo(() => sanitizedPathname === '/client/auth', [sanitizedPathname]);
  const isHomePage = useMemo(() => sanitizedPathname === '/', [sanitizedPathname]);
  const isAboutPage = useMemo(() => sanitizedPathname === '/about', [sanitizedPathname]);
  const isContactPage = useMemo(() => sanitizedPathname === '/contact', [sanitizedPathname]);
  
  // Use effect to prevent getting stuck in loading state
  useEffect(() => {
    // Set a maximum timeout for the loading state
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("App loading timeout triggered, forcing state update");
        setLocalLoadingState(false);
        
        // Try to refresh user role again if we have a user but no role
        if (user && !userRole && refreshUserRole) {
          refreshUserRole().catch(err => {
            console.error("Error refreshing user role:", err);
          });
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

  // Additional error recovery mechanism
  useEffect(() => {
    // If user gets stuck at a blank screen, attempt recovery
    if (loadError && !recoveryAttempted) {
      const recoveryTimeout = setTimeout(() => {
        setRecoveryAttempted(true);
        setLoadError(null);
        setLocalLoadingState(false);
        
        // Force a redirect to a safe route
        if (!user) {
          window.location.href = '/auth';
        } else if (userRole === 'admin') {
          window.location.href = '/admin/dashboard';
        } else if (userRole === 'client') {
          window.location.href = '/client/dashboard';
        } else {
          window.location.href = '/';
        }
      }, 5000);
      
      return () => clearTimeout(recoveryTimeout);
    }
  }, [loadError, recoveryAttempted, user, userRole]);
  
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
    if (isLoading) {
      toast.warning("Loading is taking longer than expected", {
        description: "Attempting to recover..."
      });
      setLoadError(null);
    }
  }, [isLoading]);

  // Error boundary to prevent complete app failure
  const ErrorFallback = ({ error }: { error?: Error }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-md text-center">
        <h2 className="text-red-700 text-xl mb-2">Application Error</h2>
        <p className="text-red-600 mb-4">{error?.message || "An unexpected error occurred"}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reload Application
        </button>
      </div>
    </div>
  );
  
  // Use useMemo to avoid unnecessary re-renders of entire route components
  const routeComponent = useMemo(() => {
    try {
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
        return <ErrorFallback error={new Error(loadError)} />;
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
      }
      
      // Default to home page as fallback
      return <Navigate to="/" replace />;
    } catch (error) {
      console.error("Error rendering route:", error);
      return <ErrorFallback error={error instanceof Error ? error : new Error("An unexpected error occurred")} />;
    }
  }, [user, userRole, isLoading, isPublicRoute, isAuthCallback, localLoadingState, loadError, isAuthPage, handleLoadingComplete]);
  
  // Wrap the entire app in an error boundary
  try {
    return routeComponent;
  } catch (error) {
    console.error("Critical app error:", error);
    return <ErrorFallback error={error instanceof Error ? error : new Error("An unexpected error occurred")} />;
  }
}

export default App;
