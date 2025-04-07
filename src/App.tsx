
import { useMemo, useCallback, Suspense, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { PublicRoutes } from "./components/routes/PublicRoutes";
import { UnauthenticatedRoutes } from "./components/routes/UnauthenticatedRoutes";
import { AdminRoutes } from "./components/routes/AdminRoutes";
import { ClientRoutes } from "./components/routes/ClientRoutes";
import { LoadingFallback } from "./components/routes/LoadingFallback";

function App() {
  const { user, userRole, isLoading, session } = useAuth();
  const location = useLocation();
  const [forceRender, setForceRender] = useState(false);
  
  // Force render after a short delay to prevent blank screens
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceRender(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Memoize route checks to prevent unnecessary re-renders
  const isAuthCallback = useMemo(() => location.pathname.includes('/auth/callback'), [location.pathname]);
  const isAuthPage = useMemo(() => location.pathname === '/auth', [location.pathname]);
  const isClientAuthPage = useMemo(() => location.pathname === '/client/auth', [location.pathname]);
  const isHomePage = useMemo(() => location.pathname === '/', [location.pathname]);
  const isAboutPage = useMemo(() => location.pathname === '/about', [location.pathname]);
  const isContactPage = useMemo(() => location.pathname === '/contact', [location.pathname]);
  
  // Create a stable isPublicRoute value with useCallback
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

  // Handle loading timeout - show content anyway after a certain time
  const handleLoadingTimeout = useCallback(() => {
    console.log("Loading timeout reached, forcing UI update");
  }, []);

  // Use useMemo to avoid unnecessary re-renders of entire route components
  const routeComponent = useMemo(() => {
    // Skip normal loading for callback URLs
    if (isLoading && !isAuthCallback && !forceRender) {
      return <LoadingFallback 
        timeoutSeconds={2}
        onTimeoutAction={handleLoadingTimeout}
        message="Initializing application..." 
      />;
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
          <Suspense fallback={<LoadingFallback timeoutSeconds={2} />}>
            <AdminRoutes />
          </Suspense>
        );
      }
      
      if (userRole === 'client') {
        return (
          <Suspense fallback={<LoadingFallback timeoutSeconds={2} />}>
            <ClientRoutes />
          </Suspense>
        );
      }
      
      // If user is authenticated but role not determined yet, show loading briefly
      // then proceed anyway to avoid getting stuck
      return <LoadingFallback 
        timeoutSeconds={1}
        onTimeoutAction={() => console.log("No role determined, showing default route")}
      />;
    }
    
    // Default to home page as fallback
    return <Navigate to="/" replace />;
  }, [user, userRole, isLoading, isPublicRoute, isAuthCallback, forceRender, handleLoadingTimeout]);
  
  // Return the memoized route component
  return routeComponent;
}

export default App;
