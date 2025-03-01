
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type RoleRouteProps = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { isLoading, user, userRole } = useAuth();
  const location = useLocation();

  console.log("RoleRoute checking - User role:", userRole, "Allowed roles:", allowedRoles);

  // Still loading auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User doesn't have the required role
  if (!allowedRoles.includes(userRole as string)) {
    console.log("User role", userRole, "not allowed, redirecting to", userRole === 'admin' ? '/' : '/client/view');
    
    // Redirect to appropriate homepage based on role
    if (userRole === 'admin') {
      return <Navigate to="/" replace />;
    } else if (userRole === 'client') {
      return <Navigate to="/client/view" replace />;
    } else {
      return <Navigate to="/auth" replace />;
    }
  }

  return <>{children}</>;
};
