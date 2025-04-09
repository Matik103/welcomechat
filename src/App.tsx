
import React, { useMemo, useCallback, Suspense, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { PublicRoutes } from "./components/routes/PublicRoutes";
import { UnauthenticatedRoutes } from "./components/routes/UnauthenticatedRoutes";
import { AdminRoutes } from "./components/routes/AdminRoutes";
import { ClientRoutes } from "./components/routes/ClientRoutes";
import { ErrorBoundary } from "@/components";
import { LoadingFallback } from "./components/routes/LoadingFallback";
import { DEFAULT_LOADING_TIMEOUT } from "./config/env";

function App() {
  const { user, userRole, isLoading, setIsLoading } = useAuth();
  const location = useLocation();
  
  // Add effect to ensure loading state doesn't get stuck
  useEffect(() => {
    // Set timeout to ensure loading state never gets stuck
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("Force ending loading state after timeout");
        setIsLoading(false);
      }
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(timeout);
  }, [isLoading, setIsLoading]);
  
  // Memoize route checks to prevent unnecessary re-renders
  const isAuthCallback = useMemo(() => location.pathname.includes('/auth/callback'), [location.pathname]);
  const isAuthPage = useMemo(() => location.pathname === '/auth', [location.pathname]);
  const isClientAuthPage = useMemo(() => location.pathname === '/client/auth', [location.pathname]);
  const isHomePage = useMemo(() => location.pathname === '/', [location.pathname]);
  const isAboutPage = useMemo(() => location.pathname === '/about', [location.pathname]);
  const isContactPage = useMemo(() => location.pathname === '/contact', [location.pathname]);
  const isAdminPage = useMemo(() => location.pathname.startsWith('/admin'), [location.pathname]);
  const isClientPage = useMemo(() => location.pathname.startsWith('/client'), [location.pathname]);
  
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

  // Debug information
  console.log({
    userRole,
    isLoading,
    pathname: location.pathname,
    isPublicRoute: isPublicRoute(),
    isAuthCallback,
    isAdminPage,
    isClientPage,
  });

  // Use useMemo to avoid unnecessary re-renders of entire route components
  const routeComponent = useMemo(() => {
    // Show minimal loading for auth-related operations only
    if (isLoading && (isAuthCallback || (!user && isAdminPage))) {
      console.log("Rendering loading fallback for auth operations");
      return <LoadingFallback message="Loading application..." />;
    }

    // Public routes for non-authenticated users
    if (!user && isPublicRoute()) {
      console.log("Rendering public routes");
      return (
        <ErrorBoundary>
          <PublicRoutes />
        </ErrorBoundary>
      );
    }

    // Non-authenticated user routes
    if (!user) {
      console.log("Rendering unauthenticated routes");
      return (
        <ErrorBoundary>
          <UnauthenticatedRoutes />
        </ErrorBoundary>
      );
    }

    // Render based on user role - only calculate this when user and userRole are available
    if (user) {
      if (userRole === 'admin' || (isAdminPage && !userRole)) {
        console.log("Rendering admin routes");
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback message="Loading admin dashboard..." timeoutSeconds={DEFAULT_LOADING_TIMEOUT} />}>
              <AdminRoutes />
            </Suspense>
          </ErrorBoundary>
        );
      }
      
      if (userRole === 'client' || (isClientPage && !userRole)) {
        console.log("Rendering client routes");
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback message="Loading dashboard..." timeoutSeconds={DEFAULT_LOADING_TIMEOUT} />}>
              <ClientRoutes />
            </Suspense>
          </ErrorBoundary>
        );
      }
      
      // If user is authenticated but role not determined yet, show loading for max 3 seconds
      if (!userRole) {
        console.log("Role not determined, showing loading");
        return <LoadingFallback message="Verifying account..." timeoutSeconds={3} />;
      }
    }
    
    // Default to home page as fallback
    console.log("No matching route condition, navigating to home");
    return <Navigate to="/" replace />;
  }, [user, userRole, isLoading, isPublicRoute, isAuthCallback, isAdminPage, isClientPage]);
  
  // Return the memoized route component
  return routeComponent;
}

export default App;
