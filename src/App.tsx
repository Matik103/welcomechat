
import { useMemo, useCallback, Suspense } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { PublicRoutes } from "./components/routes/PublicRoutes";
import { UnauthenticatedRoutes } from "./components/routes/UnauthenticatedRoutes";
import { AdminRoutes } from "./components/routes/AdminRoutes";
import { ClientRoutes } from "./components/routes/ClientRoutes";

// Simple loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
  </div>
);

function App() {
  const { user, userRole, isLoading, session } = useAuth();
  const location = useLocation();
  
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

  // Use useMemo to avoid unnecessary re-renders of entire route components
  const routeComponent = useMemo(() => {
    // Show minimal loading for auth-related operations only
    if (isLoading && !isAuthCallback) {
      return <LoadingFallback />;
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
          <Suspense fallback={<LoadingFallback />}>
            <AdminRoutes />
          </Suspense>
        );
      }
      
      if (userRole === 'client') {
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ClientRoutes />
          </Suspense>
        );
      }
      
      // If user is authenticated but role not determined yet, show loading
      if (!userRole) {
        return <LoadingFallback />;
      }
    }
    
    // Default to home page as fallback
    return <Navigate to="/" replace />;
  }, [user, userRole, isLoading, isPublicRoute, isAuthCallback]);
  
  // Return the memoized route component
  return routeComponent;
}

export default App;
