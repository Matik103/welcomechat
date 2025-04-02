
import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { PublicRoutes } from "./components/routes/PublicRoutes";
import { UnauthenticatedRoutes } from "./components/routes/UnauthenticatedRoutes";
import { AdminRoutes } from "./components/routes/AdminRoutes";
import { ClientRoutes } from "./components/routes/ClientRoutes";
import { ConfigError } from "./components/routes/ErrorDisplay";

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
  
  // If there's a configuration error, show it
  if (false) { // Removed admin config error check to prevent blank screen
    return (
      <ConfigError 
        message="The application is missing required Supabase configuration." 
        details="The VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is missing or empty. This key is required for admin operations such as bucket management."
      />
    );
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

  // If user is authenticated but role not determined yet, don't render anything
  // This prevents the flash of wrong content
  if (user && !userRole) {
    return null;
  }
  
  // Default to client view as fallback
  return <ClientRoutes />;
}

export default App;
