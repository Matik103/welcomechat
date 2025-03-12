import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ClientRouteProps {
  children: React.ReactNode;
}

export const ClientRoute = ({ children }: ClientRouteProps) => {
  const { user, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userRole) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole === "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
