import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type RoleRouteProps = {
  allowedRole: 'admin' | 'client';
};

export const RoleRoute = ({ allowedRole }: RoleRouteProps) => {
  const { userRole } = useAuth();
  const location = useLocation();

  // If role doesn't match, redirect to appropriate dashboard
  if (userRole !== allowedRole) {
    const redirectPath = userRole === 'client' ? '/client/view' : '/';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <Outlet />;
};
