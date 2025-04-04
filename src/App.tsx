
import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { PublicRoutes } from "./components/routes/PublicRoutes";
import { UnauthenticatedRoutes } from "./components/routes/UnauthenticatedRoutes";
import { AdminRoutes } from "./components/routes/AdminRoutes";
import { ClientRoutes } from "./components/routes/ClientRoutes";

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

  // If user is authenticated but role not determined yet, redirect to home
  if (user && !userRole) {
    return <Navigate to="/" replace />;
  }
  
  // Default to home page as fallback
  return <Navigate to="/" replace />;
}

export default App;
