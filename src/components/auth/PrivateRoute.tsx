
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!userRole) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole !== "admin") {
    return <Navigate to="/client/dashboard" replace />;
  }

  return <>{children}</>;
};
