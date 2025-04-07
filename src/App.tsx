
import { useMemo, useCallback, Suspense, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { PublicRoutes } from "./components/routes/PublicRoutes";
import { UnauthenticatedRoutes } from "./components/routes/UnauthenticatedRoutes";
import { AdminRoutes } from "./components/routes/AdminRoutes";
import { ClientRoutes } from "./components/routes/ClientRoutes";
import { LoadingFallback } from "./components/routes/LoadingFallback";
import { toast } from "sonner";

function App() {
  const { user, userRole, isLoading, session } = useAuth();
  const location = useLocation();
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Memoize route checks to prevent unnecessary re-renders
  const isAuthCallback = useMemo(() => location.pathname.includes('/auth/callback'), [location.pathname]);
  const isAuthPage = useMemo(() => location.pathname === '/auth', [location.pathname]);
  const isClientAuthPage = useMemo(() => location.pathname === '/client/auth', [location.pathname]);
  const isHomePage = useMemo(() => location.pathname === '/', [location.pathname]);
  const isAboutPage = useMemo(() => location.pathname === '/about', [location.pathname]);
  const isContactPage = useMemo(() => location.pathname === '/contact', [location.pathname]);
  
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
    // Show minimal loading for auth-related operations only
    if (isLoading && !isAuthCallback) {
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
        
        // If user is authenticated but role not determined yet, show loading
        if (!userRole) {
          return <LoadingFallback message="Determining user access..." />;
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
  }, [user, userRole, isLoading, isPublicRoute, isAuthCallback, loadError, isAuthPage, handleLoadingComplete]);
  
  // Return the memoized route component
  return routeComponent;
}

export default App;
