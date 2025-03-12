import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export const PrivateRoute = () => {
  const { user, isLoading, userRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !userRole) {
    // Preserve the attempted URL for redirect after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Only redirect clients from the root path
  if (location.pathname === '/' && userRole === 'client') {
    return <Navigate to="/client/view" replace />;
  }

  return <Outlet />;
};
