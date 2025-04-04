
import { useMemo, useState } from "react";
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
  console.log('Current path:', location.pathname);
  console.log('Is public route:', isPublicRoute);
  console.log('Auth state:', { user, userRole, isLoading });
  
  // Simplified loading approach - avoid timeout mechanisms that could cause issues
  // Only show loading for non-authentication routes
  if (isLoading && !isAuthCallback && !isPublicRoute) {
    return <LoadingFallback />;
  }

  // Public route rendering for non-authenticated users
  if (!user && isPublicRoute) {
    return <PublicRoutes />;
  }

  // Non-authenticated user routes
  if (!user) {
    return <UnauthenticatedRoutes />;
  }

  // If we have a user and a definitive role, render the appropriate routes
  if (user && userRole === 'admin') {
    return <AdminRoutes />;
  }
  
  if (user && userRole === 'client') {
    return <ClientRoutes />;
  }

  // If user is authenticated but role not determined yet, show loading
  if (user && !userRole) {
    return <LoadingFallback />;
  }
  
  // Default to home page as fallback
  console.log('No matching route condition, navigating to home page');
  return <Navigate to="/" replace />;
}

export default App;
