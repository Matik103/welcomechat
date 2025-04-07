
import { useMemo, useCallback, Suspense, useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { PublicRoutes } from "./components/routes/PublicRoutes";
import { UnauthenticatedRoutes } from "./components/routes/UnauthenticatedRoutes";
import { AdminRoutes } from "./components/routes/AdminRoutes";
import { ClientRoutes } from "./components/routes/ClientRoutes";
import { LoadingFallback } from "./components/routes/LoadingFallback";
import { toast } from "sonner";
import { routes } from "./routes";

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
    }, 2000); // Reduced from 3 seconds to 2 seconds
    
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
    if (isLoading) {
      toast.warning("Loading is taking longer than expected", {
        description: "Attempting to recover..."
      });
      setLoadError(null);
    }
  }, [isLoading]);
  
  // Use Routes component directly instead of memo for better reliability
  return (
    <Suspense fallback={<LoadingFallback message="Loading application..." />}>
      {(isLoading || localLoadingState) && !isPublicRoute() ? (
        <LoadingFallback 
          onTimeoutAction={handleLoadingComplete}
          message={isAuthPage ? "Authenticating..." : "Loading application..."}
        />
      ) : loadError ? (
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
      ) : !user ? (
        isPublicRoute() ? <PublicRoutes /> : <UnauthenticatedRoutes />
      ) : userRole === 'admin' ? (
        <AdminRoutes />
      ) : userRole === 'client' ? (
        <ClientRoutes />
      ) : (
        <LoadingFallback message="Determining user access..." timeoutSeconds={5} />
      )}
    </Suspense>
  );
}

export default App;
