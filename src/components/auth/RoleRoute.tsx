
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// Define UserRole type directly as string literals
type UserRole = 'admin' | 'client';

type RoleRouteProps = {
  children: React.ReactNode;
  allowedRoles: UserRole[];
};

export const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { user, isLoading, userRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!userRole || !allowedRoles.includes(userRole as UserRole)) {
    // Determine the correct redirect path based on actual role
    const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/client/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
