import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type RoleRouteProps = {
  allowedRole: 'admin' | 'client';
};

export const RoleRoute = ({ allowedRole }: RoleRouteProps) => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If no user or no role, redirect to auth
  if (!user || !userRole) {
    return <Navigate to="/auth" replace />;
  }

  // If role doesn't match, redirect to appropriate dashboard
  if (userRole !== allowedRole) {
    const redirectPath = userRole === 'client' ? '/client/view' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};
