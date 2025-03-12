import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type RoleRouteProps = {
  allowedRole: 'admin' | 'client';
};

export const RoleRoute = ({ allowedRole }: RoleRouteProps) => {
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If no user or no role, redirect to auth while preserving the attempted URL
  if (!user || !userRole) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If role doesn't match, redirect to appropriate dashboard
  if (userRole !== allowedRole) {
    const redirectPath = userRole === 'client' ? '/client/view' : '/';
    // Don't create a redirect loop
    if (location.pathname !== redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <Outlet />;
};
