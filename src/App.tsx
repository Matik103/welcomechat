
import { useMemo, useCallback } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { PublicRoutes } from "./components/routes/PublicRoutes";
import { UnauthenticatedRoutes } from "./components/routes/UnauthenticatedRoutes";
import { AdminRoutes } from "./components/routes/AdminRoutes";
import { ClientRoutes } from "./components/routes/ClientRoutes";

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
    // Skip rendering complex components during loading to avoid flash of incorrect content
    if (isLoading && !isAuthCallback) {
      return null; // Return minimal content during loading
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
        return <AdminRoutes />;
      }
      
      if (userRole === 'client') {
        return <ClientRoutes />;
      }
      
      // If user is authenticated but role not determined yet, show minimal UI
      if (!userRole) {
        return <Navigate to="/" replace />;
      }
    }
    
    // Default to home page as fallback
    return <Navigate to="/" replace />;
  }, [user, userRole, isLoading, isPublicRoute, isAuthCallback]);
  
  // Return the memoized route component
  return routeComponent;
}

export default App;
