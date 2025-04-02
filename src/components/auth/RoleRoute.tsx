
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Define UserRole type directly as string literals
type UserRole = 'admin' | 'client';

type RoleRouteProps = {
  children: React.ReactNode;
  allowedRoles: UserRole[];
};

export const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { user, isLoading, userRole } = useAuth();
  const location = useLocation();

  // Don't show loading state - immediately render based on current auth state
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If role is still being determined, don't render anything to prevent flashing
  if (!userRole) {
    return null;
  }

  if (!allowedRoles.includes(userRole as UserRole)) {
    // Redirect admin to admin dashboard, clients to client dashboard
    const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/client/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
